export default {
  async fetch(request, env, ctx) {
    // =================================================================================
    // CONFIGURATION
    // =================================================================================
    const BRANDING = {
      creator: "Krishn Dhola",
      github: "https://github.com/I-Am-Krishn",
      provider: "I-Am-Krishn High-Speed APIs"
    };

    const CACHE_TTL = 3600; // 1 Hour Cache
    const BATCH_LIMIT = 45;
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";

    // =================================================================================
    // HELPER FUNCTIONS
    // =================================================================================
    
    function formatSize(bytes) {
      if (!bytes || bytes == 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function extractQuickKey(url) {
      // Extracts the key needed for metadata (e.g. 'gav89b61pdgsdwh')
      const match = url.match(/\/file\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    }

    // =================================================================================
    // CORE LOGIC
    // =================================================================================

    // 1. Process Single File
    async function processFile(url) {
      try {
        const quickKey = extractQuickKey(url);
        if (!quickKey) return { url, error: "Invalid MediaFire URL format" };

        // PARALLEL FETCHING: Fetch Page (for Link) and API (for Metadata) simultaneously
        const [htmlResponse, apiResponse] = await Promise.all([
          fetch(url, { headers: { "User-Agent": UA } }),
          fetch(`https://www.mediafire.com/api/1.4/file/get_info.php?quick_key=${quickKey}&response_format=json`, { headers: { "User-Agent": UA } })
        ]);

        const html = await htmlResponse.text();
        if (html.includes("File Removed") || html.includes("appear to be missing")) {
          return { url, error: "File removed by MediaFire" };
        }
        
        const directLinkMatch = html.match(/href="(https:\/\/download[^"]+)"/);
        
        // Parse Metadata API
        const apiJson = await apiResponse.json();
        const fileInfo = apiJson.response?.file_info;

        if (directLinkMatch) {
          // Priority: API Data > HTML Scraping Fallback
          const filename = fileInfo ? fileInfo.filename : (html.match(/<div class="filename">([^<]+)<\/div>/)?.[1] || "unknown");
          const sizeBytes = fileInfo ? Number(fileInfo.size) : 0;
          
          return {
            status: "success",
            filename: filename,
            file_type: fileInfo ? fileInfo.filetype : filename.split('.').pop(),
            size: {
              readable: formatSize(sizeBytes),
              bytes: sizeBytes
            },
            dates: {
              uploaded: fileInfo ? fileInfo.created : "unknown",
            },
            stats: {
              downloads: fileInfo ? fileInfo.downloads : "unknown",
              views: fileInfo ? fileInfo.views : "unknown"
            },
            direct_download: directLinkMatch[1]
          };
        } else {
          return { url, error: "No direct link found (Password protected?)" };
        }

      } catch (e) {
        return { url, error: "Processing Error: " + e.message };
      }
    }

    // 2. Process Folder
    async function processFolder(folderUrl, origin) {
      try {
        const keyMatch = folderUrl.match(/\/folder\/([a-zA-Z0-9]+)/);
        if (!keyMatch) return { error: "Invalid Folder Key" };
        const folderKey = keyMatch[1];
        
        // Internal MediaFire API for folders
        const apiUrl = `https://www.mediafire.com/api/1.4/folder/get_content.php?r=r&content_type=files&filter=all&order_by=name&order_direction=asc&chunk=1&version=1.5&folder_key=${folderKey}&response_format=json`;
        
        const apiResp = await fetch(apiUrl, { headers: { "User-Agent": UA } });
        const json = await apiResp.json();
        
        let items = [];
        let contentType = "files";

        // Logic to preview first 5 files with direct links + metadata
        if (json.response?.folder_content?.files) {
          const rawFiles = json.response.folder_content.files;
          const PREVIEW_LIMIT = 5; 
          const priorityFiles = rawFiles.slice(0, PREVIEW_LIMIT);
          const remainingFiles = rawFiles.slice(PREVIEW_LIMIT);

          // Get full data for first 5 files
          const processedPriority = await Promise.all(priorityFiles.map(async (f) => {
             const link = `https://www.mediafire.com/file/${f.quickkey}/${f.filename}/file`;
             const data = await processFile(link);
             return { ...data, view_link: link };
          }));

          // List remaining files without heavy processing
          const processedRemaining = remainingFiles.map(f => ({
            status: "queued",
            filename: f.filename,
            view_link: `https://www.mediafire.com/file/${f.quickkey}/${f.filename}/file`,
            note: "Use single file API or Batch POST to get direct link."
          }));
          items = [...processedPriority, ...processedRemaining];
        } 
        else if (items.length === 0) {
           // Check for sub-folders if no files found
           const fResp = await fetch(apiUrl.replace("content_type=files", "content_type=folders"), { headers: { "User-Agent": UA } });
           const fJson = await fResp.json();
           if (fJson.response?.folder_content?.folders) {
             contentType = "sub_folders";
             items = fJson.response.folder_content.folders.map(f => ({
               name: f.name,
               type: "folder",
               api_link: `${origin}/?url=https://www.mediafire.com/folder/${f.folderkey}`
             }));
           }
        }

        return { type: "folder", key: folderKey, content: contentType, count: items.length, items: items };
      } catch (e) { return { error: e.message }; }
    }

    // =================================================================================
    // ROUTER & CACHING
    // =================================================================================
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

    // GET Request Caching
    if (request.method === "GET") {
      const cache = caches.default;
      const cachedResponse = await cache.match(new Request(url.toString(), request));
      if (cachedResponse) {
        const r = new Response(cachedResponse.body, cachedResponse);
        r.headers.set("X-Worker-Cache", "HIT");
        return r;
      }
    }

    try {
      let result = {};

      if (request.method === "POST") {
        const body = await request.json();
        if (!body.urls) throw new Error("Missing 'urls' array");
        const batch = body.urls.slice(0, BATCH_LIMIT);
        const start = Date.now();
        const data = await Promise.all(batch.map(u => processFile(u)));
        result = { status: true, mode: "batch", time_ms: Date.now() - start, results: data };
      } else {
        const target = url.searchParams.get("url");
        if (!target) return new Response(JSON.stringify({ status: true, message: "API Ready" }, null, 2), { headers });
        
        if (target.includes("/folder/")) {
          result = { status: true, mode: "folder", data: await processFolder(target, url.origin) };
        } else {
          result = { status: true, mode: "file", data: await processFile(target) };
        }
      }

      const response = new Response(JSON.stringify({ ...BRANDING, ...result }, null, 2), {
        headers: { ...headers, "Cache-Control": `public, max-age=${CACHE_TTL}` }
      });

      if (request.method === "GET") ctx.waitUntil(caches.default.put(new Request(url.toString(), request), response.clone()));
      
      return response;

    } catch (e) {
      return new Response(JSON.stringify({ status: false, error: e.message }), { status: 500, headers });
    }
  }
};