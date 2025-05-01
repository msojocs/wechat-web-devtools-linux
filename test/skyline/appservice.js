// setNotifyWindowReadyCallback 里面添加
globalThis.SkylineGlobal = {
    // AppBarContext: originalSkylineGlobal.AppBarContext,
    // GestureHandler: originalSkylineGlobal.GestureHandler,
    // NavigatorBinding: originalSkylineGlobal.NavigatorBinding,
    // PageContext: originalSkylineGlobal.PageContext,
    PageContext: class {
      constructor(...args) {
        console.info("PageContext constructor", args);
        this.original = new originalSkylineGlobal.PageContext(...args);
      }
      get id() {
        console.info("PageContext id", this.original.id);
        return this.original.id;
      }
      get frameworkType() {
        console.info("PageContext frameworkType get", this.original.frameworkType);
        return this.original.frameworkType;
      }
      set frameworkType(v) {
        console.info("PageContext frameworkType set", v);
        this.original.frameworkType = v;
      }
      get clientHeight() {
        console.info("PageContext clientHeight", this.original.clientHeight);
        return this.original.clientHeight;
      }
      get clientWidth() {
        console.info("PageContext clientWidth", this.original.clientWidth);
        return this.original.clientWidth;
      }
      appendCompiledStyleSheets(...args) {
        console.info("PageContext appendCompiledStyleSheets", args, JSON.stringify(args));
        const result = this.original.appendCompiledStyleSheets(...args);
        console.info("PageContext appendCompiledStyleSheets result", result);
        return result;
      }
      appendStyleSheet(...args) {
        console.info("PageContext appendStyleSheet", args);
        const result = this.original.appendStyleSheet(...args);
        console.info("PageContext appendStyleSheet result", result); 
        return result;
      }
    
      appendStyleSheetIndex(...args) {
        console.info("PageContext appendStyleSheetIndex", args);
        const result = this.original.appendStyleSheetIndex(...args);
        console.info("PageContext appendStyleSheetIndex result", result);
        return result;
      }
    
      appendStyleSheets(...args) {
        console.info("PageContext appendStyleSheets", args);
        const result = this.original.appendStyleSheets(...args);
        console.info("PageContext appendStyleSheets result", result);
        return result;
      }
    
      attach(...args) {
        console.info("PageContext attach", args);
        const result = this.original.attach(...args);
        console.info("PageContext attach result", result);
        return result;
      }
    
      attachCustomRoute(...args) {
        console.info("PageContext attachCustomRoute", args);
        global.attachCustomRouteMark == undefined ? global.attachCustomRouteMark = 1 : global.attachCustomRouteMark++
        // if (global.attachCustomRouteMark > 0) {
        //   throw new Error("attachCustomRoute break!");
        // }
        const result = this.original.attachCustomRoute(...args);
        console.info("PageContext attachCustomRoute result", result);
        return result;
      }
    
      clearStylesheets(...args) {
        console.info("PageContext clearStylesheets", args);
        const result = this.original.clearStylesheets(...args);
        console.info("PageContext clearStylesheets result", result);
        return result;
      }
    
      createElement(...args) {
        if (this.createElementMark == undefined) this.createElementMark = 0
        globalThis.page = this
        const result = this.original.createElement(...args);
        if (this.createElementMark++ < 5) {
          console.info("PageContext createElement", result);  
        }
        const orgiFunc = result.getBoundingClientRect
        // result.getBoundingClientRect = function (cb) {
        //   const wrapper = (info) => {
        //     console.info("Element getBoundingClientRect:", info);
        //     cb(info)
        //   }
        //   return orgiFunc.apply(this, [wrapper]);
        // }
        return result;
      }
    
      createFragment(...args) {
        // console.info("PageContext createFragment", args);
        const result = this.original.createFragment(...args);
        // console.info("PageContext createFragment result", result);
        return result;
      }
    
      createStyleSheetIndexGroup(...args) {
        console.info("PageContext createStyleSheetIndexGroup", args);
        const result = this.original.createStyleSheetIndexGroup(...args);
        console.info("PageContext createStyleSheetIndexGroup result", result);
        return result;
      }
    
      createTextNode(...args) {
        // console.info("PageContext createTextNode", args);
        const result = this.original.createTextNode(...args);
        // console.info("PageContext createTextNode result", result);
        return result;
      }
    
      finishStyleSheetsCompilation(...args) {
        console.info("PageContext finishStyleSheetsCompilation", args);
        const result = this.original.finishStyleSheetsCompilation(...args);
        console.info("PageContext finishStyleSheetsCompilation result", result);
        return result;
      }
    
      getComputedStyle(...args) {
        console.info("PageContext getComputedStyle", args);
        const result = this.original.getComputedStyle(...args);
        return result;
      }
    
      getHostNode(...args) {
        console.info("PageContext getHostNode", args);
        const result = this.original.getHostNode(...args);
        return result;
      }
    
      getNodeFromPoint(...args) {
        console.info("PageContext getNodeFromPoint", args);
        const result = this.original.getNodeFromPoint(...args);
        return result;
      }
    
      getRootNode(...args) {
        console.info("PageContext getRootNode", args);
        const result = this.original.getRootNode(...args);
        return result;
      }
    
      getWindowId(...args) {
        console.info("PageContext getWindowId", args);
        const result = this.original.getWindowId(...args);
        return result;
      }
    
      isTab(...args) {
        console.info("PageContext isTab", args);
        const result = this.original.isTab(...args);
        return result;
      }
    
      loadFontFace(...args) {
        console.info("PageContext loadFontFace", args);
        const result = this.original.loadFontFace(...args);
        return result;
      }
    
      preCompileStyleSheets(...args) {
        console.info("PageContext preCompileStyleSheets", args);
        const result = this.original.preCompileStyleSheets(...args);
        return result;
      }
    
      recalcStyle(...args) {
        console.info("PageContext recalcStyle", args);
        const result = this.original.recalcStyle(...args);
        return result;
      }
    
      release(...args) {
        console.info("PageContext release", args);
        const result = this.original.release(...args);
        return result;
      }
    
      setAsTab(...args) {
        console.info("PageContext setAsTab", args);
        const result = this.original.setAsTab(...args);
        return result;
      }
    
      setNavigateBackInterception(...args) {
        console.info("PageContext setNavigateBackInterception", args);
        const result = this.original.setNavigateBackInterception(...args);
        return result;
      }
    
      startRender(...args) {
        console.info("PageContext startRender", args);
        global.startRenderMark == undefined ? global.startRenderMark = 1 : global.startRenderMark++
        if (global.startRenderMark > 1) {
          // throw new Error("startRender break!");
        }
        const result = this.original.startRender(() => {
          console.info("PageContext startRender callback");
          args[0]();
          console.info("PageContext startRender callback end");
        });
        console.info("PageContext startRender end");
        return result;
      }
    
      updateRouteConfig(...args) {
        console.info("PageContext updateRouteConfig", args); 
        const result = this.original.updateRouteConfig(...args);
        console.info("PageContext updateRouteConfig result", result);
        return result;
      }

    },
    // RuntimeBinding: originalSkylineGlobal.RuntimeBinding,
    // TabBarContext: originalSkylineGlobal.TabBarContext,
    // WorkletBinding: originalSkylineGlobal.WorkletBinding,
    features: {
      eventDefaultPrevented: 1,
      contextOperation: 1
    },
    gestureHandlerModule: originalSkylineGlobal.gestureHandlerModule,
    // navigator: originalSkylineGlobal.navigator,
    // requestGarbageCollectionForTesting: originalSkylineGlobal.requestGarbageCollectionForTesting,
    runtime: {
      "registerTouchCallback": (func) => {
        // console.info("registerTouchCallback called with args:", func);
        const result = originalSkylineGlobal.runtime.registerTouchCallback((...args) => {
          // console.info('emit registerTouchCallback', args)
          func(...args)
        });
        // console.info("registerTouchCallback result:", result); 
        return result;
      },
      "registerMouseCallback": (func) => {
        // console.info("registerMouseCallback called with args:", func);
        const result = originalSkylineGlobal.runtime.registerMouseCallback((...args) => {
          // console.info('emit registerMouseCallback', args)
          func(...args)
        });
        // console.info("registerMouseCallback result:", result);
        return result;
      },
      "registerTransitionCallback": (func) => {
        console.info("registerTransitionCallback called with args:", func);
        const result = originalSkylineGlobal.runtime.registerTransitionCallback((...args) => {
          console.info('emit registerTransitionCallback', args)
          func(...args)
        });
        console.info("registerTransitionCallback result:", result);
        return result;
      },
      "registerAnimationCallback": (func) => {
        console.info("registerAnimationCallback called with args:", func);
        const result = originalSkylineGlobal.runtime.registerAnimationCallback((...args) => {
          console.info('emit registerAnimationCallback', args)
          func(...args)
        });
        console.info("registerAnimationCallback result:", result);
        return result;
      },
      "registerTriggerEventCallback": (func) => {
        // console.info("registerTriggerEventCallback called with args:", func);
        const result = originalSkylineGlobal.runtime.registerTriggerEventCallback((...args) => {
          // console.info('emit registerTriggerEventCallback', args)
          func(...args)
        });
        // console.info("registerTriggerEventCallback result:", result);
        return result;
      },
      "registerPerformanceCallback": (...args) => {
        console.info("registerPerformanceCallback called with args:", args);
        const result = originalSkylineGlobal.runtime.registerPerformanceCallback(...args);
        console.info("registerPerformanceCallback result:", result);
        return result;
      },
      "registerNavigateBackInterceptCallback": (...args) => {
        console.info("registerNavigateBackInterceptCallback called with args:", args);
        const result = originalSkylineGlobal.runtime.registerNavigateBackInterceptCallback(...args);
        console.info("registerNavigateBackInterceptCallback result:", result);
        return result;
      },
      "registerJsValue": (...args) => {
        // console.info("registerJsValue called with args:", args);
        if (typeof args[0] === 'function') {
          const workletReplace = {
            575660067119: "function _f(){const{beginRect,endRect}=jsThis._closure;{globalThis['RouteCardSrcRect']=beginRect;globalThis['RouteCardDestRect']=endRect;console.info('RouteCardSrcRect:', globalThis['RouteCardSrcRect']);console.info('RouteCardDestRect:', globalThis['RouteCardDestRect']);}}"
          }
          if (workletReplace[args[0].__workletHash]) {
            args[0].asString = workletReplace[args[0].__workletHash]
          }
        }
        const result = originalSkylineGlobal.runtime.registerJsValue(...args);
        // console.info("registerJsValue result:", result);
        return result;
      },
      "unRegisterJsValue": (...args) => {
        // console.info("unRegisterJsValue called with args:", args);
        const result = originalSkylineGlobal.runtime.unRegisterJsValue(...args);
        // console.info("unRegisterJsValue result:", result);
        return result;
      },
      "getJsValueById": (...args) => {
        global.getJsValueByIdMark == undefined ? global.getJsValueByIdMark = 1 : global.getJsValueByIdMark++
        if (args[0] == 5) {
          // debugger
        }
        // console.info("getJsValueById called with args:", args);
        let result = originalSkylineGlobal.runtime.getJsValueById(...args);
        
        // console.info("getJsValueById result:", result, typeof result);
        // if (typeof result === 'function') {
        //   return (...args) => {
        //     // console.info("getJsValueById result wrapper called with args:", args);
        //     return result(...args);
        //   }
        // }
        return result;
      },
      "registerFontFaceCallback": (...args) => {
        console.info("registerFontFaceCallback called with args:", args);
        const result = originalSkylineGlobal.runtime.registerFontFaceCallback(...args);
        console.info("registerFontFaceCallback result:", result);
        return result;
      },
      "setFeatureFlags": (...args) => {
        console.info("setFeatureFlags called with args:", args);
        const result = originalSkylineGlobal.runtime.setFeatureFlags(...args);
        console.info("setFeatureFlags result:", result);
        return result;
      },
      "updateMapCustomCallout": (...args) => {
        console.info("updateMapCustomCallout called with args:", args);
        const result = originalSkylineGlobal.runtime.updateMapCustomCallout(...args);
        console.info("updateMapCustomCallout result:", result);
        return result;
      },
      "preloadAssets": (...args) => {
        console.info("preloadAssets called with args:", args);
        const result = originalSkylineGlobal.runtime.preloadAssets(...args);
        console.info("preloadAssets result:", result);
        return result;
      },
    },
    userAgent: "skyline/1.4.0 (;8f190450e6301587ce41e08afcaa983db4dc712e;)",
    workletModule: {
      installCoreFunctions: (func1) => {
        const func = function (...args) {
          console.info('-----> SkylineWorkletModule - installCoreFunctions', args)
        }
        func._closure = {
          requestFrame: (...args1) => {
              console.info("[coreFunctions] requestFrame called with args:", args1);
          }
        }
        func.asString = func1.asString
        func.__workletHash = func1.__workletHash
        func.__location = func1.__location
        func.__worklet = func1.__worklet
        console.info("installCoreFunctions called with args:", func);
        const result = originalSkylineGlobal.workletModule.installCoreFunctions(func);
        console.info("installCoreFunctions result:", result);
        return undefined;
      },
      makeShareable: (func1) => {
        // console.info("makeShareable called with args:", [func1]);
        const result = originalSkylineGlobal.workletModule.makeShareable(func1);
        return result;
      },
      makeMutable: (...args) => {
        // console.info("makeMutable called with args:", args);
        const result = originalSkylineGlobal.workletModule.makeMutable(...args);
        if (!globalThis.mutableList) globalThis.mutableList = []
        globalThis.mutableList.push(result)
        // console.info("makeMutable result:", result, result._windowId, result._value, result.value);
        // delete result._windowId
        // delete result._value
        // delete result.value
        // delete result._animation
        const orgi = result.__proto__.installGetter
        // result.installGetter = function (...args) {
        //   console.info("installGetter called with args:", result, args);
        //   const ret = orgi.apply(this, args);
        //   console.info("installGetter result:", ret);
        //   return ret;
        // }
        globalThis.makeMutableMark == undefined ? globalThis.makeMutableMark = 1 : globalThis.makeMutableMark++
        const currentMakr = globalThis.makeMutableMark;
        // result.installGetter = function (...args) {
        //   console.info(`[${currentMakr}]installGetter called with args:`, result, args);
        //   console.info(`[${currentMakr}]before value:`, result.value)
        //   const ret = orgi.apply(this, args);
        //   console.info(`[${currentMakr}]after value:`, result.value)
        //   console.info(`[${currentMakr}]installGetter result:`, ret);
        //   return ret;
        // }
        // console.info("makeMutable __hiddenHostObjectProp:", result.__hiddenHostObjectProp);
        // Object.defineProperty(result, "_value", {
        //   set: function (v) {
        //     console.info("makeMutable _value set:", v);
        //     result.value = v;
        //   }
        // })
        return result


      },
      makeRemote: (...args) => {
        global.makeRemoteMark == undefined ? global.makeRemoteMark = 1 : global.makeRemoteMark++
        console.info("makeRemote called with args:", args, global.makeRemoteMark);
        
        // const result = originalSkylineGlobal.workletModule.makeRemote(...args);
        // console.info("makeRemote result:", result);
        return {};
      },
      registerEventHandler: (...args) => {
        // console.info('registerEventHandler:', args)
        const result = originalSkylineGlobal.workletModule.registerEventHandler(...args);
        return result;
      },
      unregisterEventHandler: (...args) => {
        const result = originalSkylineGlobal.workletModule.unregisterEventHandler(...args);
        return result;
      },
      startMapper: (...args) => {
        // console.info('SkylineWorkletModule - startMapper', args)
        if (args[1].__location === "src/worklet/hook/animatedStyle.ts (66:23)") {
          args[1].asString = "function _f(_,nodes){const{updater}=jsThis._closure;{var _updater;function convertToCssText(obj){let cssText='';Object.keys(obj).forEach(function(key){const hyphenatedKey=key.replace(/([A-Z])/g,'-$1').toLowerCase();cssText+=hyphenatedKey+': '+obj[key]+'; ';});return cssText;}const updates=(_updater=updater())!==null&&_updater!==void 0?_updater:{};const inlineStyle=convertToCssText(updates);console.info('nodes:', nodes);if(!Array.isArray(nodes)){console.warn('applyAnimatedStyle can not find corresponding nodes');return;}nodes.forEach(function(node){return workletUIModule.updateNodeStyle(node,inlineStyle);});}}"
        }
        const result = originalSkylineGlobal.workletModule.startMapper(...args)
        // console.info('SkylineWorkletModule - startMapper result', result);
        return result;
      },
      stopMappers: (...args) => {
        // console.info('SkylineWorkletModule - stopMappers', args)
        const result = originalSkylineGlobal.workletModule.stopMappers(...args);
        return result;
      },
      

    },
  }