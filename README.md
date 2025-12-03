<div align="center">

# ⚡ MediaFire Direct Link API

### Lightning-Fast Serverless Link Converter

*Transform MediaFire URLs into direct downloads with enterprise-grade performance*

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/I-Am-Krishn/mediafire-direct-api/pulls)

[🚀 Live Demo](#) • [📖 Documentation](#-usage-guide) • [🐛 Report Bug](https://github.com/I-Am-Krishn/mediafire-direct-api/issues) • [✨ Request Feature](https://github.com/I-Am-Krishn/mediafire-direct-api/issues)

</div>

---

## 📋 Table of Contents

- [About](#-about-the-project)
- [Features](#-key-features)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Examples](#-examples)
- [Contributing](#-contributing)
- [Support](#-support-the-project)
- [License](#-license)

---

## 🎯 About The Project

A **production-ready Cloudflare Worker** that transforms MediaFire links into direct download URLs. Built on edge computing infrastructure, this API delivers blazing-fast performance with intelligent caching and anti-bot protection.

### 🎪 Perfect For:

- 🤖 **AI/ML Engineers** - Batch download training datasets
- 📦 **Archivists** - Programmatically backup media collections
- 🛠️ **Developers** - Integrate MediaFire into your applications
- 🔄 **Automation Tools** - Build download managers and bots

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### ⚡ Performance
- **Parallel Processing**: Handle 50+ URLs simultaneously
- **Edge Caching**: 1-hour TTL for instant responses
- **Sub-Second Response**: Average 200ms per request

</td>
<td width="50%">

### 🛡️ Reliability
- **Anti-Bot System**: Dynamic User-Agent rotation
- **Error Handling**: Graceful fallbacks for broken links
- **Rate Limit Protection**: Built-in request throttling

</td>
</tr>
<tr>
<td width="50%">

### 📊 Rich Metadata
- File name, type, and size (bytes + human-readable)
- Upload date and download statistics
- MD5 hash validation
- Folder structure detection

</td>
<td width="50%">

### 🔧 Developer Friendly
- RESTful API design
- JSON response format
- Comprehensive error messages
- Zero dependencies deployment

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Cloudflare account (free tier works!)
- Wrangler CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/I-Am-Krishn/mediafire-direct-api.git
cd mediafire-direct-api

# Install dependencies
npm install

# Deploy to Cloudflare Workers
npx wrangler deploy
```

Your API is now live at `https://your-worker.workers.dev` 🎉

---

## 📖 Usage Guide

### 🔹 Single File Lookup

Extract download link and metadata for a single file.

**Endpoint:** `GET /?url={mediafire_url}`

```bash
curl "https://your-worker.workers.dev/?url=https://www.mediafire.com/file/example/file.zip"
```

**Response:**
```json
{
  "status": true,
  "filename": "Project_v1.zip",
  "file_type": "zip",
  "size": {
    "readable": "135.41 MB",
    "bytes": 142023123
  },
  "dates": {
    "uploaded": "2023-10-15"
  },
  "stats": {
    "downloads": "15,420"
  },
  "hash": "a3d5e8f2c1b9d4e7",
  "direct_download": "https://download123.mediafire.com/..."
}
```

---

### 🔹 Batch Processing

Process multiple URLs concurrently with maximum efficiency.

**Endpoint:** `POST /`

```bash
curl -X POST https://your-worker.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.mediafire.com/file/example1",
      "https://www.mediafire.com/file/example2",
      "https://www.mediafire.com/file/example3"
    ]
  }'
```

**Response:**
```json
{
  "status": true,
  "mode": "batch",
  "processed": 3,
  "time_ms": 847,
  "results": [
    {
      "status": "success",
      "url": "https://www.mediafire.com/file/example1",
      "filename": "dataset.zip",
      "direct_download": "https://download456.mediafire.com/..."
    },
    {
      "status": "success",
      "url": "https://www.mediafire.com/file/example2",
      "filename": "image.jpg",
      "direct_download": "https://download789.mediafire.com/..."
    },
    {
      "status": "error",
      "url": "https://www.mediafire.com/file/example3",
      "message": "File not found or removed"
    }
  ]
}
```

---

### 🔹 Folder Support

Automatically extract all files from MediaFire folders.

```bash
curl "https://your-worker.workers.dev/?url=https://www.mediafire.com/folder/abc123"
```

**Response:**
```json
{
  "status": true,
  "type": "folder",
  "folder_name": "Project Assets",
  "file_count": 12,
  "files": [
    {
      "filename": "image1.png",
      "direct_download": "https://..."
    },
    {
      "filename": "document.pdf",
      "direct_download": "https://..."
    }
  ]
}
```

---

## 🛠️ API Reference

### Response Status Codes

| Code | Description |
|------|-------------|
| `200` | Success - Direct link retrieved |
| `400` | Bad Request - Invalid URL format |
| `404` | Not Found - File removed or private |
| `429` | Rate Limit - Too many requests |
| `500` | Server Error - Processing failed |

### Error Response Format

```json
{
  "status": false,
  "error": "File not found",
  "code": 404,
  "url": "https://www.mediafire.com/file/invalid"
}
```

---

## 🌐 Deployment

### Deploy to Cloudflare Workers

1. **Login to Wrangler**
   ```bash
   npx wrangler login
   ```

2. **Configure `wrangler.toml`**
   ```toml
   name = "mediafire-api"
   main = "src/index.js"
   compatibility_date = "2024-01-01"
   ```

3. **Deploy**
   ```bash
   npx wrangler deploy
   ```

### Custom Domain (Optional)

Add a custom domain in your Cloudflare dashboard under Workers Routes.

---

## 💡 Examples

### Python Integration

```python
import requests

# Single file
response = requests.get(
    "https://your-worker.workers.dev/",
    params={"url": "https://www.mediafire.com/file/example"}
)
data = response.json()
print(f"Download: {data['direct_download']}")

# Batch processing
batch_response = requests.post(
    "https://your-worker.workers.dev/",
    json={
        "urls": [
            "https://www.mediafire.com/file/example1",
            "https://www.mediafire.com/file/example2"
        ]
    }
)
```

### JavaScript/Node.js

```javascript
// Using fetch
const response = await fetch(
  `https://your-worker.workers.dev/?url=${encodeURIComponent(mediafireUrl)}`
);
const data = await response.json();
console.log(data.direct_download);

// Batch processing
const batchResponse = await fetch('https://your-worker.workers.dev/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: ['https://www.mediafire.com/file/1', 'https://www.mediafire.com/file/2']
  })
});
```

---

## 🤝 Contributing

Contributions make the open-source community thrive! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ☕ Support the Project

If this API saved you time, consider supporting its development!

<div align="center">

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/iamkrishn)

*Your support helps maintain this project and keeps it free for everyone* ❤️

</div>

---

## 📄 License

Distributed under the MIT License. See `LICENSE` file for more information.

---

## 🌟 Acknowledgments

- Built with [Cloudflare Workers](https://workers.cloudflare.com/)
- Inspired by the need for reliable MediaFire automation
- Community feedback and contributions

---

<div align="center">

### Made with ⚡ by [Krishn Dhola](https://github.com/I-Am-Krishn)

**Star ⭐ this repository if you found it helpful!**

[![GitHub Stars](https://img.shields.io/github/stars/I-Am-Krishn/mediafire-direct-api?style=social)](https://github.com/I-Am-Krishn/mediafire-direct-api/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/I-Am-Krishn/mediafire-direct-api?style=social)](https://github.com/I-Am-Krishn/mediafire-direct-api/network/members)

</div>
