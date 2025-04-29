(() => {
    if (!window.skylineRequireReplace) {
      window.skylineRequireReplace = true
      const originalRequire = window.require
      if (originalRequire) {
        window.require = function (m) {
          if (m.includes('skyline.node')) {
            // 给native用的
            globalThis.__sharedMemory = originalRequire('sharedMemory/sharedMemory.node')
          }
          return originalRequire(m)
        }
        window.require.cache = originalRequire.cache
        window.require.extensions = originalRequire.extensions
        window.require.resolve = originalRequire.resolve
      }
    }
  })();