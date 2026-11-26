/**
 * Zero-GCP Google Apps Script SSoT Sync -> Vercel -> Supabase (`ssot_documents`)
 *
 * Why this exists:
 *   Runs directly inside regular consumer Google Drive (https://script.google.com)
 *   using built-in `DriveApp` + `ScriptApp.getOAuthToken()` + `UrlFetchApp`.
 *   Requires ZERO Google Cloud Console project and ZERO Service Account keys.
 *
 * Setup (2 minutes at the end when populating env vars):
 *   1. Open https://script.google.com -> New Project -> paste this file.
 *   2. Open Project Settings (gear icon) -> Script Properties -> Add 3 properties:
 *        VERCEL_SYNC_URL       = https://<your-unlisted-app-domain>/api/admin/sync-drive
 *        OWNER_ACCESS_SECRET   = <same OWNER_ACCESS_SECRET set in Vercel>
 *        SSOT_ROOT_FOLDER_ID   = <your SSoT Files Drive Folder ID>
 *        MASTER_SPEC_FOLDER_ID = <optional Master Spec Drive Folder ID>
 *   3. In `appsscript.json` (enable in Project Settings -> Show "appsscript.json"), ensure scopes include:
 *        "oauthScopes": [
 *          "https://www.googleapis.com/auth/drive.readonly",
 *          "https://www.googleapis.com/auth/script.external_request"
 *        ]
 *   4. Run `syncDriveSsotToVercel()` manually or add a time-driven trigger (e.g. daily).
 */

function syncDriveSsotToVercel() {
  var props = PropertiesService.getScriptProperties();
  var syncUrl = props.getProperty('VERCEL_SYNC_URL');
  var ownerSecret = props.getProperty('OWNER_ACCESS_SECRET');
  var rootFolderId = props.getProperty('SSOT_ROOT_FOLDER_ID');
  var specFolderId = props.getProperty('MASTER_SPEC_FOLDER_ID');

  if (!syncUrl || !ownerSecret || !rootFolderId) {
    throw new Error('Missing Script Properties: set VERCEL_SYNC_URL, OWNER_ACCESS_SECRET, and SSOT_ROOT_FOLDER_ID.');
  }

  var oauthToken = ScriptApp.getOAuthToken();
  var batch = [];

  if (specFolderId) {
    collectFolderDocsRecursive_(specFolderId, 'Policies', oauthToken, batch);
  }
  collectFolderDocsRecursive_(rootFolderId, 'General', oauthToken, batch);

  // Send in chunks of 50 documents so payloads stay well inside serverless limits
  var chunkSize = 50;
  for (var i = 0; i < batch.length; i += chunkSize) {
    var slice = batch.slice(i, i + chunkSize);
    var resp = UrlFetchApp.fetch(syncUrl, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + ownerSecret
      },
      payload: JSON.stringify({
        mode: 'push_batch',
        force: false,
        docs: slice
      }),
      muteHttpExceptions: true
    });
    Logger.log('Chunk ' + (i / chunkSize + 1) + ' HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText());
  }
}

function collectFolderDocsRecursive_(folderId, categoryHint, oauthToken, outBatch) {
  var folder = DriveApp.getFolderById(folderId);
  var folderName = folder.getName();
  if (/archive|deprecated|trash/i.test(folderName)) {
    return;
  }

  var effectiveCategory = folderName === 'Root' ? categoryHint : folderName;
  var files = folder.getFilesByType(MimeType.GOOGLE_DOCS);
  while (files.hasNext()) {
    var file = files.next();
    var fileId = file.getId();
    var exportUrl =
      'https://www.googleapis.com/drive/v3/files/' +
      encodeURIComponent(fileId) +
      '/export?mimeType=' +
      encodeURIComponent('text/markdown');

    var res = UrlFetchApp.fetch(exportUrl, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + oauthToken },
      muteHttpExceptions: true
    });

    if (res.getResponseCode() === 200) {
      outBatch.push({
        driveFileId: fileId,
        title: file.getName(),
        parentFolderName: effectiveCategory,
        contentMd: res.getContentText('UTF-8'),
        driveModifiedAt: file.getLastUpdated().toISOString()
      });
    }
  }

  var subs = folder.getFolders();
  while (subs.hasNext()) {
    var sub = subs.next();
    collectFolderDocsRecursive_(sub.getId(), sub.getName(), oauthToken, outBatch);
  }
}
