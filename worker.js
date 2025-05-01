const CACHE_TIME = 60 * 60 * 1000;

let keyCache = {
  value: null,
  expiry: 0,
  lastUpdate: null
};

async function forceUpdateKey() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/zutzo/yuedukey/refs/heads/main/key.txt');
    const key = await response.text();
    const now = Date.now();
    
    keyCache = {
      value: key.trim(),
      expiry: now + CACHE_TIME,
      lastUpdate: now
    };
    
    return { success: true, key: keyCache.value };
  } catch (error) {
    console.error('更新 key 失败:', error);
    return { success: false, error: error.message };
  }
}

async function getKey() {
  const now = Date.now();
  
  if (keyCache.value && now < keyCache.expiry) {
    return keyCache.value;
  }

  const result = await forceUpdateKey();
  return result.success ? result.key : '';
}

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // 处理根路径请求
  if (url.pathname === '/') {
    const now = Date.now();
    const key = await getKey();
    const lastUpdate = keyCache.lastUpdate ? new Date(keyCache.lastUpdate).toLocaleString() : 'Never';
    const nextUpdate = keyCache.expiry ? new Date(keyCache.expiry).toLocaleString() : 'Unknown';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>502 Bad Gateway</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
        }
        .key-info {
            margin-top: 20px;
            padding: 10px;
            border-top: 1px solid #ccc;
            font-size: 0.9em;
            color: #666;
        }
        .update-link {
            color: #0066cc;
            text-decoration: none;
        }
        .update-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>502 Bad Gateway</h1>
    <p>The server encountered a temporary error and could not complete your request.</p>
    <p>Please try again in 30 seconds.</p>
    <div class="key-info">
        <p>Current Key: ${key}</p>
        <p>Last Update: ${lastUpdate}</p>
        <p>Next Update: ${nextUpdate}</p>
        <p><a href="/upkey" class="update-link">Update Key Now</a></p>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    });
  }

  // 处理更新密钥请求
  if (url.pathname === '/upkey') {
    const result = await forceUpdateKey();
    return new Response(JSON.stringify({
      success: result.success,
      message: result.success ? 'Key updated successfully' : 'Failed to update key',
      key: result.success ? result.key : null,
      error: result.error || null,
      lastUpdate: keyCache.lastUpdate ? new Date(keyCache.lastUpdate).toLocaleString() : null,
      nextUpdate: keyCache.expiry ? new Date(keyCache.expiry).toLocaleString() : null
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 创建目标 URL
  let targetUrl = 'https://book.komr.cn' + url.pathname + url.search;
  
  if (url.pathname.startsWith('/content')) {
    const key = await getKey();
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl += `${separator}key=${key}`;
  }

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    return modifiedResponse;
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
