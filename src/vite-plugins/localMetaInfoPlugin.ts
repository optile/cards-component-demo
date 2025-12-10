import type { Plugin } from "vite";

/**
 * Vite plugin to intercept and modify meta-info.json responses
 * This allows us to rewrite URLs in the meta-info to point to local servers
 */
export function localMetaInfoPlugin(): Plugin {
  return {
    name: "local-meta-info-rewriter",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Intercept checkout-web script to inject local stripe URL override
        if (
          req.url?.includes("/local-checkout-web/build/umd/checkout-web.min.js")
        ) {
          try {
            // Fetch the actual checkout-web script
            const response = await fetch(
              "http://localhost:8700/build/umd/checkout-web.min.js"
            );
            let script = await response.text();

            // Inject code to override the stripe meta-info URL
            // This MUST run before checkout-web captures fetch reference
            const override = `
            // Override fetch BEFORE any other code runs
            console.log('🔧 Installing fetch override for local stripe meta-info');
            const originalFetch = globalThis.fetch || window.fetch;
            globalThis.fetch = window.fetch = function(url, options) {
              console.log('🌐 Fetch intercepted:', url);
              // Intercept stripe meta-info requests and redirect to local
              if (typeof url === 'string' && url.includes('/web/libraries/checkout-web-stripe/meta-info.json')) {
                console.log('🔀 Redirecting stripe meta-info to local:', url, '→', 'http://localhost:3000/local-checkout-web-stripe/meta-info.json');
                return originalFetch.call(this, 'http://localhost:3000/local-checkout-web-stripe/meta-info.json', options);
              }
              // Also intercept any direct requests to stripe loader
              if (typeof url === 'string' && url.includes('payoneer-stripe-loader.js')) {
                console.log('🔀 Redirecting stripe loader to local:', url, '→', 'http://localhost:3000/local-checkout-web-stripe/payoneer-stripe-loader.js');
                return originalFetch.call(this, 'http://localhost:3000/local-checkout-web-stripe/payoneer-stripe-loader.js', options);
              }
              return originalFetch.call(this, url, options);
            };
            `;
            script = override + script;

            res.setHeader("Content-Type", "application/javascript");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(script);
            return;
          } catch (error) {
            console.error(
              "Failed to fetch and patch checkout-web script:",
              error
            );
            next();
            return;
          }
        }

        // Intercept requests to local proxied meta-info.json files
        if (req.url?.includes("/local-checkout-web/build/meta-info.json")) {
          try {
            // Fetch the actual meta-info from local checkout-web server
            const response = await fetch(
              "http://localhost:8700/build/meta-info.json"
            );
            const metaInfo = await response.json();

            // Modify the meta-info to use absolute proxied URLs
            const modifiedMetaInfo = rewriteMetaInfoUrls(
              metaInfo,
              "http://localhost:3000/local-checkout-web/build"
            );

            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify(modifiedMetaInfo));
            return;
          } catch (error) {
            console.error(
              "Failed to fetch local checkout-web meta-info:",
              error
            );
            next();
            return;
          }
        }

        // Proxy all other checkout-web requests (scripts, etc.)
        if (req.url?.startsWith("/local-checkout-web/")) {
          try {
            const path = req.url.replace("/local-checkout-web", "");
            const targetUrl = `http://localhost:8700${path}`;
            console.log(
              "🔀 Proxying checkout-web request:",
              req.url,
              "→",
              targetUrl
            );

            const response = await fetch(targetUrl);

            if (!response.ok) {
              console.error(
                "Failed to fetch from checkout-web server:",
                response.status,
                response.statusText
              );
              res.statusCode = response.status;
              res.end();
              return;
            }

            const content = await response.text();

            // Set appropriate content type based on file extension
            if (req.url.endsWith(".js")) {
              res.setHeader("Content-Type", "application/javascript");
            } else if (req.url.endsWith(".json")) {
              res.setHeader("Content-Type", "application/json");
            }

            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(content);
            return;
          } catch (error) {
            console.error("Failed to proxy checkout-web request:", error);
            res.statusCode = 500;
            res.end();
            return;
          }
        }

        if (req.url?.includes("/local-checkout-web-stripe/meta-info.json")) {
          try {
            // Fetch the actual meta-info from local checkout-web-stripe server
            const response = await fetch(
              "http://localhost:8991/meta-info.json"
            );
            const metaInfo = await response.json();

            // Modify the meta-info to use absolute proxied URLs
            const modifiedMetaInfo = rewriteMetaInfoUrls(
              metaInfo,
              "http://localhost:3000/local-checkout-web-stripe"
            );

            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify(modifiedMetaInfo));
            return;
          } catch (error) {
            console.error(
              "Failed to fetch local checkout-web-stripe meta-info:",
              error
            );
            next();
            return;
          }
        }

        // Proxy all other checkout-web-stripe requests (scripts, etc.)
        if (req.url?.startsWith("/local-checkout-web-stripe/")) {
          try {
            const path = req.url.replace("/local-checkout-web-stripe", "");
            const targetUrl = `http://localhost:8991${path}`;
            console.log("🔀 Proxying stripe request:", req.url, "→", targetUrl);

            const response = await fetch(targetUrl);

            if (!response.ok) {
              console.error(
                "Failed to fetch from stripe server:",
                response.status,
                response.statusText
              );
              res.statusCode = response.status;
              res.end();
              return;
            }

            const content = await response.text();

            // Set appropriate content type based on file extension
            if (req.url.endsWith(".js")) {
              res.setHeader("Content-Type", "application/javascript");
            } else if (req.url.endsWith(".json")) {
              res.setHeader("Content-Type", "application/json");
            }

            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(content);
            return;
          } catch (error) {
            console.error("Failed to proxy stripe request:", error);
            res.statusCode = 500;
            res.end();
            return;
          }
        }

        next();
      });
    },
  };
}

/**
 * Rewrite URLs in meta-info to use local proxy paths
 * Only rewrites localhost URLs - leaves external URLs (stripe, google-pay, etc.) untouched
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rewriteMetaInfoUrls(metaInfo: any, proxyPrefix: string): any {
  if (!metaInfo || typeof metaInfo !== "object") {
    return metaInfo;
  }

  // Handle arrays
  if (Array.isArray(metaInfo)) {
    return metaInfo.map((item) => rewriteMetaInfoUrls(item, proxyPrefix));
  }

  const modified = { ...metaInfo };

  // Iterate through all properties and rewrite 'src' fields
  for (const key in modified) {
    if (typeof modified[key] === "object" && modified[key] !== null) {
      // Check if this is an array (e.g., checkout-web array)
      if (Array.isArray(modified[key])) {
        modified[key] = modified[key].map((item) =>
          rewriteMetaInfoUrls(item, proxyPrefix)
        );
      }
      // Check if this object has a 'src' field that needs rewriting
      else if (
        "src" in modified[key] &&
        typeof modified[key].src === "string"
      ) {
        const srcUrl = modified[key].src;

        // Skip external URLs (stripe, google-pay, etc.)
        if (srcUrl.startsWith("https://") && !srcUrl.includes("localhost")) {
          // Keep external URLs unchanged
          // No modification needed
        }
        // Rewrite localhost URLs or relative paths
        else if (
          srcUrl.startsWith("http://localhost:") ||
          srcUrl.startsWith("/") ||
          (!srcUrl.startsWith("http://") && !srcUrl.startsWith("https://"))
        ) {
          // Extract just the path part (everything after the domain)
          let path = srcUrl;
          if (srcUrl.startsWith("http://localhost:")) {
            try {
              const url = new URL(srcUrl);
              path = url.pathname;
            } catch {
              // If URL parsing fails, use as-is
            }
          } else if (!path.startsWith("/")) {
            // For relative paths without leading slash, add it
            path = "/" + path;
          }

          modified[key] = {
            ...modified[key],
            src: `${proxyPrefix}${path}`,
          };
        }
      }
      // Recursively process nested objects
      else {
        modified[key] = rewriteMetaInfoUrls(modified[key], proxyPrefix);
      }
    }
  }

  return modified;
}
