const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const nfs = require("fs");
const os = require("os");
const DEBUG_OUTPUT = process.env["WX_DEBUG_COMPILER_OUTPUT"];

function parseDeps(source, x, pageConfig, funcName) {
    // 插入引用信息
    let dep_x = `var x=['`;
    let dep_gz = "";
    let dep_d_ = "";
    let t_x = [];
    if (funcName !== "$gwx") {
        // TODO: 可能存在自定义目录无法识别的问题？
        // 非标准函数名
        t_x = x.filter(
            (ele) =>
                ele.startsWith("./miniprogram_npm") ||
                ele.startsWith("../") ||
                ele.startsWith("./page")
        );
    }
    for (let key in pageConfig) {
        if (pageConfig[key].deps.length > 0) {
            for (let dep of pageConfig[key].deps) {
                let index = x.indexOf(dep);
                if (index < 0) {
                    continue;
                }
                // x
                if (!t_x.includes(dep)) t_x.push(dep);
            }
        }
    }
    let i = 1;
    for (let dep of t_x) {
        if (dep.startsWith("../")) continue;

        // d_
        const d_Exp = `d_\\[x\\[${x.indexOf(
            dep
        )}\\]\\]={}\n[\\s\\S]*?e_\\[x\\[${x.indexOf(
            dep
        )}\\]\\]={f:m\\d+,j:\\[.*?\\],i:\\[.*?\\],ti:\\[(.*?)\\],ic:\\[.*?\\]}`;

        let m0 = source.match(new RegExp(d_Exp));
        let m0_str = m0[0];
        const depIndex = m0[1].match(/\d+/g);
        if (depIndex) {
            for (let index of depIndex) {
                m0_str = m0_str.replace(
                    new RegExp(`x\\[${index}\\]`, "g"),
                    `x[${t_x.indexOf(x[index])}]`
                );
            }
        }
        // process.stderr.write(dep + '=====' + x.indexOf(dep) + "-" + t_x.indexOf(dep) + '\n')
        dep_d_ +=
            m0_str
                .replace(
                    new RegExp(`x\\[${x.indexOf(dep)}\\]`, "g"),
                    `x[${t_x.indexOf(dep)}]`
                )
                .replace(
                    new RegExp(`\\${funcName}\\_\\d+`, "g"),
                    `${funcName}_${i}`
                )
                .replace(/m\d+/g, `m${i - 1}`) + "\n";
        let gz_name = m0_str.match(/var z=gz(.*?)\(\)/)[1];
        // process.stderr.write("get funcName - " + t[0].match(/var z=gz(.*?)\(\)/)[1] + "\n")
        // gz
        const exp = `function gz\\${gz_name}\\(\\)\\{[\\s\\S]*?__WXML_GLOBAL__\\.ops_cached\\.\\${gz_name}\n}`;
        DEBUG_OUTPUT &&
            process.stderr.write("COMMON=====" + dep + "----" + exp + "\n");
        const gz = source.match(new RegExp(exp));
        dep_gz +=
            gz[0].replace(
                new RegExp(`\\${funcName}\\_\\d+`, "g"),
                `${funcName}_${i}`
            ) + "\n";
        i++;
    }
    dep_x += `${t_x.join("','")}'];`;
    return {
        dep_x,
        dep_gz,
        dep_d_,
    };
}
function genFunctionContent_LL(wxmlName, config = {}, source, funcName, x) {
    // 起始
    let content =
        `${config.funcName}` +
        "=function(_,_v,_n,_p,_s,_wp,_wl,$gwn,$gwl,$gwh,wh,$gstack,$gwrt,gra,grb,TestTest,wfor,_ca,_da,_r,_rz,_o,_oz,_1,_1z,_2,_2z,_m,_mz,nv_getDate,nv_getRegExp,nv_console,nv_parseInt,nv_parseFloat,nv_isNaN,nv_isFinite,nv_decodeURI,nv_decodeURIComponent,nv_encodeURI,nv_encodeURIComponent,$gdc,nv_JSON,_af,_gv,_ai,_grp,_gd,_gapi,$ixc,_ic,_w,_ev,_tsd){return function(path,global){\u000aif(typeof global==='undefined'){if (typeof __GWX_GLOBAL__==='undefined')global={};else global=__GWX_GLOBAL__;}if(typeof __WXML_GLOBAL__ === 'undefined') {__WXML_GLOBAL__={};\u000a}__WXML_GLOBAL__.modules = __WXML_GLOBAL__.modules || {};\u000a";
    //
    content +=
        "var e_={}\u000aif(typeof(global.entrys)==='undefined')global.entrys={};e_=global.entrys;\u000avar d_={}\u000aif(typeof(global.defines)==='undefined')global.defines={};d_=global.defines;\u000avar f_={}\u000aif(typeof(global.modules)==='undefined')global.modules={};f_=global.modules || {};\u000avar p_={}\u000a";

    // cs
    const cs = source.match(/var cs([\s\S]*?)function gz/);
    content +=
        "var cs" +
        cs[1].replace(new RegExp(`\\${funcName}`, "g"), config.funcName);

    // gz函数
    const exp = `function gz\\${funcName}_${
        config.num + 1
    }\\(\\)\\{[\\s\\S]*_WXML_GLOBAL__\\.ops_cached\\.\\${funcName}_${
        config.num + 1
    }\n}`;
    const gz = source.match(new RegExp(exp))[0];
    content += gz;

    // debug
    let debug = source.match(
        new RegExp(
            `\\n__WXML_GLOBAL__\\.ops_set\\.\\${funcName}=[\\s\\S]*?\\nvar`
        )
    );
    debug = debug[0]
        .substring(0, debug[0].length - 3)
        .replace(new RegExp(`\\${funcName}`, "g"), config.funcName);
    content += debug;

    content += `var x=['./${wxmlName}.wxml'`;
    // m0 --- m{num}
    const m0Exp = `var m${config.num}=function\\(e,s,r,gg\\){[\\s\\S]*e_\\[x\\[(\\d+)\\]\\]={f:m${config.num},j:\\[.*?\\],i:\\[.*?\\],ti:\\[(.*?)\\],ic:\\[.*?\\]}`;
    const m0 = source.match(new RegExp(m0Exp));
    let m0_str = m0[0].replace(new RegExp(`m${config.num}`, "g"), "m0");
    const cur_x = m0[1]; // cur_x与config.num不一定相同
    m0_str = m0_str.replace(new RegExp(`x\\[${cur_x}\\]`, "g"), "x[0]");
    const depIndex = m0[2].match(/\d+/g);
    if (depIndex) {
        let i = 1;
        for (let index of depIndex) {
            content += `,'${x[index]}'`;
            m0_str = m0_str.replace(
                new RegExp(`x\\[${index}\\]`, "g"),
                `x[${i++}]`
            );
        }
    }
    content += `];d_[x[0]]={}\u000a`;
    m0_str = m0_str.replace(new RegExp(`x\\[${config.num}\\]`, "g"), "x[0]");
    content += m0_str.replace(
        new RegExp(`\\${funcName}\\_\\d+`, "g"),
        `${config.funcName}_1`
    );

    // path
    content += `\u000aif(path&&e_[path]){\u000awindow.__wxml_comp_version__=0.02\u000areturn function(env,dd,global){$gwxc=0;var root={\u0022tag\u0022:\u0022wx-page\u0022};root.children=[]\u000a;g=\u0022${config.funcName}\u0022;var main=e_[path].f\u000acs=[]\u000aif (typeof global===\u0022undefined\u0022)global={};global.f=$gdc(f_[path],\u0022\u0022,1);\u000aif(typeof(window.__webview_engine_version__)!='undefined'&&window.__webview_engine_version__+1e-6>=0.02+1e-6&&window.__mergeData__)\u000a{\u000aenv=window.__mergeData__(env,dd);\u000a}\u000atry{\u000amain(env,{},root,global);\u000a_tsd(root)\u000aif(typeof(window.__webview_engine_version__)=='undefined'|| window.__webview_engine_version__+1e-6<0.01+1e-6){return _ev(root);}\u000a}catch(err){\u000aconsole.log(cs, env);\u000aconsole.log(err)\u000athrow err\u000a}\u000a;g=\u0022\u0022;\u000areturn root;\u000a}\u000a}\u000a}\u000a}`;
    // end
    content += `(__g.a,__g.b,__g.c,__g.d,__g.e,__g.f,__g.g,__g.h,__g.i,__g.j,__g.k,__g.l,__g.m,__g.n,__g.o,__g.p,__g.q,__g.r,__g.s,__g.t,__g.u,__g.v,__g.w,__g.x,__g.y,__g.z,__g.A,__g.B,__g.C,__g.D,__g.E,__g.F,__g.G,__g.H,__g.I,__g.J,__g.K,__g.L,__g.M,__g.N,__g.O,__g.P,__g.Q,__g.R,__g.S,__g.T,__g.U,__g.V,__g.W,__g.X,__g.Y,__g.Z,__g.aa);if(__vd_version_info__.delayedGwx||false)${config.funcName}();`;
    content = content.replace(
        new RegExp(`\\${funcName}_${config.num + 1}`, "g"),
        `${config.funcName}_1`
    );
    // console.log(content)
    return content;
}
function genCommonContent_LL(source, funcName, pageConfig, x) {
    let common =
        "var __wxAppData=__wxAppData||{};var __wxAppCode__=__wxAppCode__||{};var global=global||{};var __WXML_GLOBAL__=__WXML_GLOBAL__||{entrys:{},defines:{},modules:{},ops:[],wxs_nf_init:undefined,total_ops:0};var Component=Component||function(){};var definePlugin=definePlugin||function(){};var requirePlugin=requirePlugin||function(){};var Behavior=Behavior||function(){};var __vd_version_info__=__vd_version_info__||{};var __GWX_GLOBAL__=__GWX_GLOBAL__||{};if(this&&this.__g===undefined)Object.defineProperty(this,\u0022__g\u0022,{configurable:false,enumerable:false,writable:false,value:function(){function D(e,t){if(typeof t!=\u0022undefined\u0022)e.children.push(t)}function S(e){if(typeof e!=\u0022undefined\u0022)return{tag:\u0022virtual\u0022,wxKey:e,children:[]};return{tag:\u0022virtual\u0022,children:[]}}function v(e){$gwxc++;if($gwxc>=16e3){throw\u0022Dom limit exceeded, please check if there's any mistake you've made.\u0022}return{tag:\u0022wx-\u0022+e,attr:{},children:[],n:[],raw:{},generics:{}}}function e(e,t){t&&e.properities.push(t)}function t(e,t,r){return typeof e[r]!=\u0022undefined\u0022?e[r]:t[r]}function u(e){console.warn(\u0022WXMLRT_\u0022+g+\u0022:\u0022+e)}function r(e,t){u(t+\u0022:-1:-1:-1: Template `\u0022+e+\u0022` is being called recursively, will be stop.\u0022)}var s=console.warn;var n=console.log;function o(){function e(){}e.prototype={hn:function(e,t){if(typeof e==\u0022object\u0022){var r=0;var n=false,o=false;for(var a in e){n=n|a===\u0022__value__\u0022;o=o|a===\u0022__wxspec__\u0022;r++;if(r>2)break}return r==2&&n&&o&&(t||e.__wxspec__!==\u0022m\u0022||this.hn(e.__value__)===\u0022h\u0022)?\u0022h\u0022:\u0022n\u0022}return\u0022n\u0022},nh:function(e,t){return{__value__:e,__wxspec__:t?t:true}},rv:function(e){return this.hn(e,true)===\u0022n\u0022?e:this.rv(e.__value__)},hm:function(e){if(typeof e==\u0022object\u0022){var t=0;var r=false,n=false;for(var o in e){r=r|o===\u0022__value__\u0022;n=n|o===\u0022__wxspec__\u0022;t++;if(t>2)break}return t==2&&r&&n&&(e.__wxspec__===\u0022m\u0022||this.hm(e.__value__))}return false}};return new e}var A=o();function T(e){var t=e.split(\u0022\u005cn \u0022+\u0022 \u0022+\u0022 \u0022+\u0022 \u0022);for(var r=0;r<t.length;++r){if(0==r)continue;if(\u0022)\u0022===t[r][t[r].length-1])t[r]=t[r].replace(/\u005cs\u005c(.*\u005c)$/,\u0022\u0022);else t[r]=\u0022at anonymous function\u0022}return t.join(\u0022\u005cn \u0022+\u0022 \u0022+\u0022 \u0022+\u0022 \u0022)}function a(M){function m(e,t,r,n,o){var a=false;var i=e[0][1];var p,u,l,f,v,c;switch(i){case\u0022?:\u0022:p=x(e[1],t,r,n,o,a);l=M&&A.hn(p)===\u0022h\u0022;f=A.rv(p)?x(e[2],t,r,n,o,a):x(e[3],t,r,n,o,a);f=l&&A.hn(f)===\u0022n\u0022?A.nh(f,\u0022c\u0022):f;return f;break;case\u0022&&\u0022:p=x(e[1],t,r,n,o,a);l=M&&A.hn(p)===\u0022h\u0022;f=A.rv(p)?x(e[2],t,r,n,o,a):A.rv(p);f=l&&A.hn(f)===\u0022n\u0022?A.nh(f,\u0022c\u0022):f;return f;break;case\u0022||\u0022:p=x(e[1],t,r,n,o,a);l=M&&A.hn(p)===\u0022h\u0022;f=A.rv(p)?A.rv(p):x(e[2],t,r,n,o,a);f=l&&A.hn(f)===\u0022n\u0022?A.nh(f,\u0022c\u0022):f;return f;break;case\u0022+\u0022:case\u0022*\u0022:case\u0022/\u0022:case\u0022%\u0022:case\u0022|\u0022:case\u0022^\u0022:case\u0022&\u0022:case\u0022===\u0022:case\u0022==\u0022:case\u0022!=\u0022:case\u0022!==\u0022:case\u0022>=\u0022:case\u0022<=\u0022:case\u0022>\u0022:case\u0022<\u0022:case\u0022<<\u0022:case\u0022>>\u0022:p=x(e[1],t,r,n,o,a);u=x(e[2],t,r,n,o,a);l=M&&(A.hn(p)===\u0022h\u0022||A.hn(u)===\u0022h\u0022);switch(i){case\u0022+\u0022:f=A.rv(p)+A.rv(u);break;case\u0022*\u0022:f=A.rv(p)*A.rv(u);break;case\u0022/\u0022:f=A.rv(p)/A.rv(u);break;case\u0022%\u0022:f=A.rv(p)%A.rv(u);break;case\u0022|\u0022:f=A.rv(p)|A.rv(u);break;case\u0022^\u0022:f=A.rv(p)^A.rv(u);break;case\u0022&\u0022:f=A.rv(p)&A.rv(u);break;case\u0022===\u0022:f=A.rv(p)===A.rv(u);break;case\u0022==\u0022:f=A.rv(p)==A.rv(u);break;case\u0022!=\u0022:f=A.rv(p)!=A.rv(u);break;case\u0022!==\u0022:f=A.rv(p)!==A.rv(u);break;case\u0022>=\u0022:f=A.rv(p)>=A.rv(u);break;case\u0022<=\u0022:f=A.rv(p)<=A.rv(u);break;case\u0022>\u0022:f=A.rv(p)>A.rv(u);break;case\u0022<\u0022:f=A.rv(p)<A.rv(u);break;case\u0022<<\u0022:f=A.rv(p)<<A.rv(u);break;case\u0022>>\u0022:f=A.rv(p)>>A.rv(u);break;default:break}return l?A.nh(f,\u0022c\u0022):f;break;case\u0022-\u0022:p=e.length===3?x(e[1],t,r,n,o,a):0;u=e.length===3?x(e[2],t,r,n,o,a):x(e[1],t,r,n,o,a);l=M&&(A.hn(p)===\u0022h\u0022||A.hn(u)===\u0022h\u0022);f=l?A.rv(p)-A.rv(u):p-u;return l?A.nh(f,\u0022c\u0022):f;break;case\u0022!\u0022:p=x(e[1],t,r,n,o,a);l=M&&A.hn(p)==\u0022h\u0022;f=!A.rv(p);return l?A.nh(f,\u0022c\u0022):f;case\u0022~\u0022:p=x(e[1],t,r,n,o,a);l=M&&A.hn(p)==\u0022h\u0022;f=~A.rv(p);return l?A.nh(f,\u0022c\u0022):f;default:s(\u0022unrecognized op\u0022+i)}}function x(e,t,r,n,o,a){var i=e[0];var p=false;if(typeof a!==\u0022undefined\u0022)o.ap=a;if(typeof i===\u0022object\u0022){var u=i[0];var l,f,v,c,s,y,b,d,h,_,g;switch(u){case 2:return m(e,t,r,n,o);break;case 4:return x(e[1],t,r,n,o,p);break;case 5:switch(e.length){case 2:l=x(e[1],t,r,n,o,p);return M?[l]:[A.rv(l)];return[l];break;case 1:return[];break;default:l=x(e[1],t,r,n,o,p);v=x(e[2],t,r,n,o,p);l.push(M?v:A.rv(v));return l;break}break;case 6:l=x(e[1],t,r,n,o);var w=o.ap;h=A.hn(l)===\u0022h\u0022;f=h?A.rv(l):l;o.is_affected|=h;if(M){if(f===null||typeof f===\u0022undefined\u0022){return h?A.nh(undefined,\u0022e\u0022):undefined}v=x(e[2],t,r,n,o,p);_=A.hn(v)===\u0022h\u0022;c=_?A.rv(v):v;o.ap=w;o.is_affected|=_;if(c===null||typeof c===\u0022undefined\u0022||c===\u0022__proto__\u0022||c===\u0022prototype\u0022||c===\u0022caller\u0022){return h||_?A.nh(undefined,\u0022e\u0022):undefined}y=f[c];if(typeof y===\u0022function\u0022&&!w)y=undefined;g=A.hn(y)===\u0022h\u0022;o.is_affected|=g;return h||_?g?y:A.nh(y,\u0022e\u0022):y}else{if(f===null||typeof f===\u0022undefined\u0022){return undefined}v=x(e[2],t,r,n,o,p);_=A.hn(v)===\u0022h\u0022;c=_?A.rv(v):v;o.ap=w;o.is_affected|=_;if(c===null||typeof c===\u0022undefined\u0022||c===\u0022__proto__\u0022||c===\u0022prototype\u0022||c===\u0022caller\u0022){return undefined}y=f[c];if(typeof y===\u0022function\u0022&&!w)y=undefined;g=A.hn(y)===\u0022h\u0022;o.is_affected|=g;return g?A.rv(y):y}case 7:switch(e[1][0]){case 11:o.is_affected|=A.hn(n)===\u0022h\u0022;return n;case 3:b=A.rv(r);d=A.rv(t);v=e[1][1];if(n&&n.f&&n.f.hasOwnProperty(v)){l=n.f;o.ap=true}else{l=b&&b.hasOwnProperty(v)?r:d&&d.hasOwnProperty(v)?t:undefined}if(M){if(l){h=A.hn(l)===\u0022h\u0022;f=h?A.rv(l):l;y=f[v];g=A.hn(y)===\u0022h\u0022;o.is_affected|=h||g;y=h&&!g?A.nh(y,\u0022e\u0022):y;return y}}else{if(l){h=A.hn(l)===\u0022h\u0022;f=h?A.rv(l):l;y=f[v];g=A.hn(y)===\u0022h\u0022;o.is_affected|=h||g;return A.rv(y)}}return undefined}break;case 8:l={};l[e[1]]=x(e[2],t,r,n,o,p);return l;break;case 9:l=x(e[1],t,r,n,o,p);v=x(e[2],t,r,n,o,p);function O(e,t,r){var n,o;h=A.hn(e)===\u0022h\u0022;_=A.hn(t)===\u0022h\u0022;f=A.rv(e);c=A.rv(t);for(var a in c){if(r||!f.hasOwnProperty(a)){f[a]=M?_?A.nh(c[a],\u0022e\u0022):c[a]:A.rv(c[a])}}return e}var s=l;var j=true;if(typeof e[1][0]===\u0022object\u0022&&e[1][0][0]===10){l=v;v=s;j=false}if(typeof e[1][0]===\u0022object\u0022&&e[1][0][0]===10){var P={};return O(O(P,l,j),v,j)}else return O(l,v,j);break;case 10:l=x(e[1],t,r,n,o,p);l=M?l:A.rv(l);return l;break;case 12:var P;l=x(e[1],t,r,n,o);if(!o.ap){return M&&A.hn(l)===\u0022h\u0022?A.nh(P,\u0022f\u0022):P}var w=o.ap;v=x(e[2],t,r,n,o,p);o.ap=w;h=A.hn(l)===\u0022h\u0022;_=N(v);f=A.rv(l);c=A.rv(v);snap_bb=K(c,\u0022nv_\u0022);try{P=typeof f===\u0022function\u0022?K(f.apply(null,snap_bb)):undefined}catch(t){t.message=t.message.replace(/nv_/g,\u0022\u0022);t.stack=t.stack.substring(0,t.stack.indexOf(\u0022\u005cn\u0022,t.stack.lastIndexOf(\u0022at nv_\u0022)));t.stack=t.stack.replace(/\u005csnv_/g,\u0022 \u0022);t.stack=T(t.stack);if(n.debugInfo){t.stack+=\u0022\u005cn \u0022+\u0022 \u0022+\u0022 \u0022+\u0022 at \u0022+n.debugInfo[0]+\u0022:\u0022+n.debugInfo[1]+\u0022:\u0022+n.debugInfo[2];console.error(t)}P=undefined}return M&&(_||h)?A.nh(P,\u0022f\u0022):P}}else{if(i===3||i===1)return e[1];else if(i===11){var l=\u0022\u0022;for(var D=1;D<e.length;D++){var S=A.rv(x(e[D],t,r,n,o,p));l+=typeof S===\u0022undefined\u0022?\u0022\u0022:S}return l}}}function e(e,t,r,n,o,a){if(e[0]==\u002211182016\u0022){n.debugInfo=e[2];return x(e[1],t,r,n,o,a)}else{n.debugInfo=null;return x(e,t,r,n,o,a)}}return e}var f=a(true);var c=a(false);function i(e,t,r,n,o,a,i,p){{var u={is_affected:false};var l=f(t,r,n,o,u);if(JSON.stringify(l)!=JSON.stringify(a)||u.is_affected!=p){console.warn(\u0022A. \u0022+e+\u0022 get result \u0022+JSON.stringify(l)+\u0022, \u0022+u.is_affected+\u0022, but \u0022+JSON.stringify(a)+\u0022, \u0022+p+\u0022 is expected\u0022)}}{var u={is_affected:false};var l=c(t,r,n,o,u);if(JSON.stringify(l)!=JSON.stringify(i)||u.is_affected!=p){console.warn(\u0022B. \u0022+e+\u0022 get result \u0022+JSON.stringify(l)+\u0022, \u0022+u.is_affected+\u0022, but \u0022+JSON.stringify(i)+\u0022, \u0022+p+\u0022 is expected\u0022)}}}function y(e,t,r,n,o,a,i,p,u){var l=A.hn(e)===\u0022n\u0022;var f=A.rv(n);var v=f.hasOwnProperty(i);var c=f.hasOwnProperty(p);var s=f[i];var y=f[p];var b=Object.prototype.toString.call(A.rv(e));var d=b[8];if(d===\u0022N\u0022&&b[10]===\u0022l\u0022)d=\u0022X\u0022;var h;if(l){if(d===\u0022A\u0022){var _;for(var g=0;g<e.length;g++){f[i]=e[g];f[p]=l?g:A.nh(g,\u0022h\u0022);_=A.rv(e[g]);var w=u&&_?u===\u0022*this\u0022?_:A.rv(_[u]):undefined;h=S(w);D(a,h);t(r,f,h,o)}}else if(d===\u0022O\u0022){var g=0;var _;for(var O in e){f[i]=e[O];f[p]=l?O:A.nh(O,\u0022h\u0022);_=A.rv(e[O]);var w=u&&_?u===\u0022*this\u0022?_:A.rv(_[u]):undefined;h=S(w);D(a,h);t(r,f,h,o);g++}}else if(d===\u0022S\u0022){for(var g=0;g<e.length;g++){f[i]=e[g];f[p]=l?g:A.nh(g,\u0022h\u0022);h=S(e[g]+g);D(a,h);t(r,f,h,o)}}else if(d===\u0022N\u0022){for(var g=0;g<e;g++){f[i]=g;f[p]=l?g:A.nh(g,\u0022h\u0022);h=S(g);D(a,h);t(r,f,h,o)}}else{}}else{var j=A.rv(e);var _,P;if(d===\u0022A\u0022){for(var g=0;g<j.length;g++){P=j[g];P=A.hn(P)===\u0022n\u0022?A.nh(P,\u0022h\u0022):P;_=A.rv(P);f[i]=P;f[p]=l?g:A.nh(g,\u0022h\u0022);var w=u&&_?u===\u0022*this\u0022?_:A.rv(_[u]):undefined;h=S(w);D(a,h);t(r,f,h,o)}}else if(d===\u0022O\u0022){var g=0;for(var O in j){P=j[O];P=A.hn(P)===\u0022n\u0022?A.nh(P,\u0022h\u0022):P;_=A.rv(P);f[i]=P;f[p]=l?O:A.nh(O,\u0022h\u0022);var w=u&&_?u===\u0022*this\u0022?_:A.rv(_[u]):undefined;h=S(w);D(a,h);t(r,f,h,o);g++}}else if(d===\u0022S\u0022){for(var g=0;g<j.length;g++){P=A.nh(j[g],\u0022h\u0022);f[i]=P;f[p]=l?g:A.nh(g,\u0022h\u0022);h=S(e[g]+g);D(a,h);t(r,f,h,o)}}else if(d===\u0022N\u0022){for(var g=0;g<j;g++){P=A.nh(g,\u0022h\u0022);f[i]=P;f[p]=l?g:A.nh(g,\u0022h\u0022);h=S(g);D(a,h);t(r,f,h,o)}}else{}}if(v){f[i]=s}else{delete f[i]}if(c){f[p]=y}else{delete f[p]}}function N(e){if(A.hn(e)==\u0022h\u0022)return true;if(typeof e!==\u0022object\u0022)return false;for(var t in e){if(e.hasOwnProperty(t)){if(N(e[t]))return true}}return false}function b(e,t,r,n,o){var a=false;var i=K(n,\u0022\u0022,2);if(o.ap&&i&&i.constructor===Function){t=\u0022$wxs:\u0022+t;e.attr[\u0022$gdc\u0022]=K}if(o.is_affected||N(n)){e.n.push(t);e.raw[t]=n}e.attr[t]=i}function d(e,t,r,n,o,a){a.opindex=r;var i={},p;var u=c(z[r],n,o,a,i);b(e,t,r,u,i)}function h(e,t,r,n,o,a,i){i.opindex=n;var p={},u;var l=c(e[n],o,a,i,p);b(t,r,n,l,p)}function p(e,t,r,n){n.opindex=e;var o={};var a=c(z[e],t,r,n,o);return a&&a.constructor===Function?undefined:a}function l(e,t,r,n,o){o.opindex=t;var a={};var i=c(e[t],r,n,o,a);return i&&i.constructor===Function?undefined:i}function _(e,t,r,n,o){var o=o||{};n.opindex=e;return f(z[e],t,r,n,o)}function w(e,t,r,n,o,a){var a=a||{};o.opindex=t;return f(e[t],r,n,o,a)}function O(e,t,r,n,o,a,i,p,u){var l={};var f=_(e,r,n,o);y(f,t,r,n,o,a,i,p,u)}function j(e,t,r,n,o,a,i,p,u,l){var f={};var v=w(e,t,n,o,a);y(v,r,n,o,a,i,p,u,l)}function P(e,t,r,n,o,a){var i=v(e);var p=0;for(var u=0;u<t.length;u+=2){if(p+t[u+1]<0){i.attr[t[u]]=true}else{d(i,t[u],p+t[u+1],n,o,a);if(p===0)p=t[u+1]}}for(var u=0;u<r.length;u+=2){if(p+r[u+1]<0){i.generics[r[u]]=\u0022\u0022}else{var l=c(z[p+r[u+1]],n,o,a);if(l!=\u0022\u0022)l=\u0022wx-\u0022+l;i.generics[r[u]]=l;if(p===0)p=r[u+1]}}return i}function M(e,t,r,n,o,a,i){var p=v(t);var u=0;for(var l=0;l<r.length;l+=2){if(u+r[l+1]<0){p.attr[r[l]]=true}else{h(e,p,r[l],u+r[l+1],o,a,i);if(u===0)u=r[l+1]}}for(var l=0;l<n.length;l+=2){if(u+n[l+1]<0){p.generics[n[l]]=\u0022\u0022}else{var f=c(e[u+n[l+1]],o,a,i);if(f!=\u0022\u0022)f=\u0022wx-\u0022+f;p.generics[n[l]]=f;if(u===0)u=n[l+1]}}return p}var m=function(){if(typeof __WXML_GLOBAL__===\u0022undefined\u0022||undefined===__WXML_GLOBAL__.wxs_nf_init){x();C();k();U();I();L();E();R();F()}if(typeof __WXML_GLOBAL__!==\u0022undefined\u0022)__WXML_GLOBAL__.wxs_nf_init=true};var x=function(){Object.defineProperty(Object.prototype,\u0022nv_constructor\u0022,{writable:true,value:\u0022Object\u0022});Object.defineProperty(Object.prototype,\u0022nv_toString\u0022,{writable:true,value:function(){return\u0022[object Object]\u0022}})};var C=function(){Object.defineProperty(Function.prototype,\u0022nv_constructor\u0022,{writable:true,value:\u0022Function\u0022});Object.defineProperty(Function.prototype,\u0022nv_length\u0022,{get:function(){return this.length},set:function(){}});Object.defineProperty(Function.prototype,\u0022nv_toString\u0022,{writable:true,value:function(){return\u0022[function Function]\u0022}})};var k=function(){Object.defineProperty(Array.prototype,\u0022nv_toString\u0022,{writable:true,value:function(){return this.nv_join()}});Object.defineProperty(Array.prototype,\u0022nv_join\u0022,{writable:true,value:function(e){e=undefined==e?\u0022,\u0022:e;var t=\u0022\u0022;for(var r=0;r<this.length;++r){if(0!=r)t+=e;if(null==this[r]||undefined==this[r])t+=\u0022\u0022;else if(typeof this[r]==\u0022function\u0022)t+=this[r].nv_toString();else if(typeof this[r]==\u0022object\u0022&&this[r].nv_constructor===\u0022Array\u0022)t+=this[r].nv_join();else t+=this[r].toString()}return t}});Object.defineProperty(Array.prototype,\u0022nv_constructor\u0022,{writable:true,value:\u0022Array\u0022});Object.defineProperty(Array.prototype,\u0022nv_concat\u0022,{writable:true,value:Array.prototype.concat});Object.defineProperty(Array.prototype,\u0022nv_pop\u0022,{writable:true,value:Array.prototype.pop});Object.defineProperty(Array.prototype,\u0022nv_push\u0022,{writable:true,value:Array.prototype.push});Object.defineProperty(Array.prototype,\u0022nv_reverse\u0022,{writable:true,value:Array.prototype.reverse});Object.defineProperty(Array.prototype,\u0022nv_shift\u0022,{writable:true,value:Array.prototype.shift});Object.defineProperty(Array.prototype,\u0022nv_slice\u0022,{writable:true,value:Array.prototype.slice});Object.defineProperty(Array.prototype,\u0022nv_sort\u0022,{writable:true,value:Array.prototype.sort});Object.defineProperty(Array.prototype,\u0022nv_splice\u0022,{writable:true,value:Array.prototype.splice});Object.defineProperty(Array.prototype,\u0022nv_unshift\u0022,{writable:true,value:Array.prototype.unshift});Object.defineProperty(Array.prototype,\u0022nv_indexOf\u0022,{writable:true,value:Array.prototype.indexOf});Object.defineProperty(Array.prototype,\u0022nv_lastIndexOf\u0022,{writable:true,value:Array.prototype.lastIndexOf});Object.defineProperty(Array.prototype,\u0022nv_every\u0022,{writable:true,value:Array.prototype.every});Object.defineProperty(Array.prototype,\u0022nv_some\u0022,{writable:true,value:Array.prototype.some});Object.defineProperty(Array.prototype,\u0022nv_forEach\u0022,{writable:true,value:Array.prototype.forEach});Object.defineProperty(Array.prototype,\u0022nv_map\u0022,{writable:true,value:Array.prototype.map});Object.defineProperty(Array.prototype,\u0022nv_filter\u0022,{writable:true,value:Array.prototype.filter});Object.defineProperty(Array.prototype,\u0022nv_reduce\u0022,{writable:true,value:Array.prototype.reduce});Object.defineProperty(Array.prototype,\u0022nv_reduceRight\u0022,{writable:true,value:Array.prototype.reduceRight});Object.defineProperty(Array.prototype,\u0022nv_length\u0022,{get:function(){return this.length},set:function(e){this.length=e}})};var U=function(){Object.defineProperty(String.prototype,\u0022nv_constructor\u0022,{writable:true,value:\u0022String\u0022});Object.defineProperty(String.prototype,\u0022nv_toString\u0022,{writable:true,value:String.prototype.toString});Object.defineProperty(String.prototype,\u0022nv_valueOf\u0022,{writable:true,value:String.prototype.valueOf});Object.defineProperty(String.prototype,\u0022nv_charAt\u0022,{writable:true,value:String.prototype.charAt});Object.defineProperty(String.prototype,\u0022nv_charCodeAt\u0022,{writable:true,value:String.prototype.charCodeAt});Object.defineProperty(String.prototype,\u0022nv_concat\u0022,{writable:true,value:String.prototype.concat});Object.defineProperty(String.prototype,\u0022nv_indexOf\u0022,{writable:true,value:String.prototype.indexOf});Object.defineProperty(String.prototype,\u0022nv_lastIndexOf\u0022,{writable:true,value:String.prototype.lastIndexOf});Object.defineProperty(String.prototype,\u0022nv_localeCompare\u0022,{writable:true,value:String.prototype.localeCompare});Object.defineProperty(String.prototype,\u0022nv_match\u0022,{writable:true,value:String.prototype.match});Object.defineProperty(String.prototype,\u0022nv_replace\u0022,{writable:true,value:String.prototype.replace});Object.defineProperty(String.prototype,\u0022nv_search\u0022,{writable:true,value:String.prototype.search});Object.defineProperty(String.prototype,\u0022nv_slice\u0022,{writable:true,value:String.prototype.slice});Object.defineProperty(String.prototype,\u0022nv_split\u0022,{writable:true,value:String.prototype.split});Object.defineProperty(String.prototype,\u0022nv_substring\u0022,{writable:true,value:String.prototype.substring});Object.defineProperty(String.prototype,\u0022nv_toLowerCase\u0022,{writable:true,value:String.prototype.toLowerCase});Object.defineProperty(String.prototype,\u0022nv_toLocaleLowerCase\u0022,{writable:true,value:String.prototype.toLocaleLowerCase});Object.defineProperty(String.prototype,\u0022nv_toUpperCase\u0022,{writable:true,value:String.prototype.toUpperCase});Object.defineProperty(String.prototype,\u0022nv_toLocaleUpperCase\u0022,{writable:true,value:String.prototype.toLocaleUpperCase});Object.defineProperty(String.prototype,\u0022nv_trim\u0022,{writable:true,value:String.prototype.trim});Object.defineProperty(String.prototype,\u0022nv_length\u0022,{get:function(){return this.length},set:function(e){this.length=e}})};var I=function(){Object.defineProperty(Boolean.prototype,\u0022nv_constructor\u0022,{writable:true,value:\u0022Boolean\u0022});Object.defineProperty(Boolean.prototype,\u0022nv_toString\u0022,{writable:true,value:Boolean.prototype.toString});Object.defineProperty(Boolean.prototype,\u0022nv_valueOf\u0022,{writable:true,value:Boolean.prototype.valueOf})};var L=function(){Object.defineProperty(Number,\u0022nv_MAX_VALUE\u0022,{writable:false,value:Number.MAX_VALUE});Object.defineProperty(Number,\u0022nv_MIN_VALUE\u0022,{writable:false,value:Number.MIN_VALUE});Object.defineProperty(Number,\u0022nv_NEGATIVE_INFINITY\u0022,{writable:false,value:Number.NEGATIVE_INFINITY});Object.defineProperty(Number,\u0022nv_POSITIVE_INFINITY\u0022,{writable:false,value:Number.POSITIVE_INFINITY});Object.defineProperty(Number.prototype,\u0022nv_constructor\u0022,{writable:true,value:\u0022Number\u0022});Object.defineProperty(Number.prototype,\u0022nv_toString\u0022,{writable:true,value:Number.prototype.toString});Object.defineProperty(Number.prototype,\u0022nv_toLocaleString\u0022,{writable:true,value:Number.prototype.toLocaleString});Object.defineProperty(Number.prototype,\u0022nv_valueOf\u0022,{writable:true,value:Number.prototype.valueOf});Object.defineProperty(Number.prototype,\u0022nv_toFixed\u0022,{writable:true,value:Number.prototype.toFixed});Object.defineProperty(Number.prototype,\u0022nv_toExponential\u0022,{writable:true,value:Number.prototype.toExponential});Object.defineProperty(Number.prototype,\u0022nv_toPrecision\u0022,{writable:true,value:Number.prototype.toPrecision})};var E=function(){Object.defineProperty(Math,\u0022nv_E\u0022,{writable:false,value:Math.E});Object.defineProperty(Math,\u0022nv_LN10\u0022,{writable:false,value:Math.LN10});Object.defineProperty(Math,\u0022nv_LN2\u0022,{writable:false,value:Math.LN2});Object.defineProperty(Math,\u0022nv_LOG2E\u0022,{writable:false,value:Math.LOG2E});Object.defineProperty(Math,\u0022nv_LOG10E\u0022,{writable:false,value:Math.LOG10E});Object.defineProperty(Math,\u0022nv_PI\u0022,{writable:false,value:Math.PI});Object.defineProperty(Math,\u0022nv_SQRT1_2\u0022,{writable:false,value:Math.SQRT1_2});Object.defineProperty(Math,\u0022nv_SQRT2\u0022,{writable:false,value:Math.SQRT2});Object.defineProperty(Math,\u0022nv_abs\u0022,{writable:false,value:Math.abs});Object.defineProperty(Math,\u0022nv_acos\u0022,{writable:false,value:Math.acos});Object.defineProperty(Math,\u0022nv_asin\u0022,{writable:false,value:Math.asin});Object.defineProperty(Math,\u0022nv_atan\u0022,{writable:false,value:Math.atan});Object.defineProperty(Math,\u0022nv_atan2\u0022,{writable:false,value:Math.atan2});Object.defineProperty(Math,\u0022nv_ceil\u0022,{writable:false,value:Math.ceil});Object.defineProperty(Math,\u0022nv_cos\u0022,{writable:false,value:Math.cos});Object.defineProperty(Math,\u0022nv_exp\u0022,{writable:false,value:Math.exp});Object.defineProperty(Math,\u0022nv_floor\u0022,{writable:false,value:Math.floor});Object.defineProperty(Math,\u0022nv_log\u0022,{writable:false,value:Math.log});Object.defineProperty(Math,\u0022nv_max\u0022,{writable:false,value:Math.max});Object.defineProperty(Math,\u0022nv_min\u0022,{writable:false,value:Math.min});Object.defineProperty(Math,\u0022nv_pow\u0022,{writable:false,value:Math.pow});Object.defineProperty(Math,\u0022nv_random\u0022,{writable:false,value:Math.random});Object.defineProperty(Math,\u0022nv_round\u0022,{writable:false,value:Math.round});Object.defineProperty(Math,\u0022nv_sin\u0022,{writable:false,value:Math.sin});Object.defineProperty(Math,\u0022nv_sqrt\u0022,{writable:false,value:Math.sqrt});Object.defineProperty(Math,\u0022nv_tan\u0022,{writable:false,value:Math.tan})};var R=function(){Object.defineProperty(Date.prototype,\u0022nv_constructor\u0022,{writable:true,value:\u0022Date\u0022});Object.defineProperty(Date,\u0022nv_parse\u0022,{writable:true,value:Date.parse});Object.defineProperty(Date,\u0022nv_UTC\u0022,{writable:true,value:Date.UTC});Object.defineProperty(Date,\u0022nv_now\u0022,{writable:true,value:Date.now});Object.defineProperty(Date.prototype,\u0022nv_toString\u0022,{writable:true,value:Date.prototype.toString});Object.defineProperty(Date.prototype,\u0022nv_toDateString\u0022,{writable:true,value:Date.prototype.toDateString});Object.defineProperty(Date.prototype,\u0022nv_toTimeString\u0022,{writable:true,value:Date.prototype.toTimeString});Object.defineProperty(Date.prototype,\u0022nv_toLocaleString\u0022,{writable:true,value:Date.prototype.toLocaleString});Object.defineProperty(Date.prototype,\u0022nv_toLocaleDateString\u0022,{writable:true,value:Date.prototype.toLocaleDateString});Object.defineProperty(Date.prototype,\u0022nv_toLocaleTimeString\u0022,{writable:true,value:Date.prototype.toLocaleTimeString});Object.defineProperty(Date.prototype,\u0022nv_valueOf\u0022,{writable:true,value:Date.prototype.valueOf});Object.defineProperty(Date.prototype,\u0022nv_getTime\u0022,{writable:true,value:Date.prototype.getTime});Object.defineProperty(Date.prototype,\u0022nv_getFullYear\u0022,{writable:true,value:Date.prototype.getFullYear});Object.defineProperty(Date.prototype,\u0022nv_getUTCFullYear\u0022,{writable:true,value:Date.prototype.getUTCFullYear});Object.defineProperty(Date.prototype,\u0022nv_getMonth\u0022,{writable:true,value:Date.prototype.getMonth});Object.defineProperty(Date.prototype,\u0022nv_getUTCMonth\u0022,{writable:true,value:Date.prototype.getUTCMonth});Object.defineProperty(Date.prototype,\u0022nv_getDate\u0022,{writable:true,value:Date.prototype.getDate});Object.defineProperty(Date.prototype,\u0022nv_getUTCDate\u0022,{writable:true,value:Date.prototype.getUTCDate});Object.defineProperty(Date.prototype,\u0022nv_getDay\u0022,{writable:true,value:Date.prototype.getDay});Object.defineProperty(Date.prototype,\u0022nv_getUTCDay\u0022,{writable:true,value:Date.prototype.getUTCDay});Object.defineProperty(Date.prototype,\u0022nv_getHours\u0022,{writable:true,value:Date.prototype.getHours});Object.defineProperty(Date.prototype,\u0022nv_getUTCHours\u0022,{writable:true,value:Date.prototype.getUTCHours});Object.defineProperty(Date.prototype,\u0022nv_getMinutes\u0022,{writable:true,value:Date.prototype.getMinutes});Object.defineProperty(Date.prototype,\u0022nv_getUTCMinutes\u0022,{writable:true,value:Date.prototype.getUTCMinutes});Object.defineProperty(Date.prototype,\u0022nv_getSeconds\u0022,{writable:true,value:Date.prototype.getSeconds});Object.defineProperty(Date.prototype,\u0022nv_getUTCSeconds\u0022,{writable:true,value:Date.prototype.getUTCSeconds});Object.defineProperty(Date.prototype,\u0022nv_getMilliseconds\u0022,{writable:true,value:Date.prototype.getMilliseconds});Object.defineProperty(Date.prototype,\u0022nv_getUTCMilliseconds\u0022,{writable:true,value:Date.prototype.getUTCMilliseconds});Object.defineProperty(Date.prototype,\u0022nv_getTimezoneOffset\u0022,{writable:true,value:Date.prototype.getTimezoneOffset});Object.defineProperty(Date.prototype,\u0022nv_setTime\u0022,{writable:true,value:Date.prototype.setTime});Object.defineProperty(Date.prototype,\u0022nv_setMilliseconds\u0022,{writable:true,value:Date.prototype.setMilliseconds});Object.defineProperty(Date.prototype,\u0022nv_setUTCMilliseconds\u0022,{writable:true,value:Date.prototype.setUTCMilliseconds});Object.defineProperty(Date.prototype,\u0022nv_setSeconds\u0022,{writable:true,value:Date.prototype.setSeconds});Object.defineProperty(Date.prototype,\u0022nv_setUTCSeconds\u0022,{writable:true,value:Date.prototype.setUTCSeconds});Object.defineProperty(Date.prototype,\u0022nv_setMinutes\u0022,{writable:true,value:Date.prototype.setMinutes});Object.defineProperty(Date.prototype,\u0022nv_setUTCMinutes\u0022,{writable:true,value:Date.prototype.setUTCMinutes});Object.defineProperty(Date.prototype,\u0022nv_setHours\u0022,{writable:true,value:Date.prototype.setHours});Object.defineProperty(Date.prototype,\u0022nv_setUTCHours\u0022,{writable:true,value:Date.prototype.setUTCHours});Object.defineProperty(Date.prototype,\u0022nv_setDate\u0022,{writable:true,value:Date.prototype.setDate});Object.defineProperty(Date.prototype,\u0022nv_setUTCDate\u0022,{writable:true,value:Date.prototype.setUTCDate});Object.defineProperty(Date.prototype,\u0022nv_setMonth\u0022,{writable:true,value:Date.prototype.setMonth});Object.defineProperty(Date.prototype,\u0022nv_setUTCMonth\u0022,{writable:true,value:Date.prototype.setUTCMonth});Object.defineProperty(Date.prototype,\u0022nv_setFullYear\u0022,{writable:true,value:Date.prototype.setFullYear});Object.defineProperty(Date.prototype,\u0022nv_setUTCFullYear\u0022,{writable:true,value:Date.prototype.setUTCFullYear});Object.defineProperty(Date.prototype,\u0022nv_toUTCString\u0022,{writable:true,value:Date.prototype.toUTCString});Object.defineProperty(Date.prototype,\u0022nv_toISOString\u0022,{writable:true,value:Date.prototype.toISOString});Object.defineProperty(Date.prototype,\u0022nv_toJSON\u0022,{writable:true,value:Date.prototype.toJSON})};var F=function(){Object.defineProperty(RegExp.prototype,\u0022nv_constructor\u0022,{writable:true,value:\u0022RegExp\u0022});Object.defineProperty(RegExp.prototype,\u0022nv_exec\u0022,{writable:true,value:RegExp.prototype.exec});Object.defineProperty(RegExp.prototype,\u0022nv_test\u0022,{writable:true,value:RegExp.prototype.test});Object.defineProperty(RegExp.prototype,\u0022nv_toString\u0022,{writable:true,value:RegExp.prototype.toString});Object.defineProperty(RegExp.prototype,\u0022nv_source\u0022,{get:function(){return this.source},set:function(){}});Object.defineProperty(RegExp.prototype,\u0022nv_global\u0022,{get:function(){return this.global},set:function(){}});Object.defineProperty(RegExp.prototype,\u0022nv_ignoreCase\u0022,{get:function(){return this.ignoreCase},set:function(){}});Object.defineProperty(RegExp.prototype,\u0022nv_multiline\u0022,{get:function(){return this.multiline},set:function(){}});Object.defineProperty(RegExp.prototype,\u0022nv_lastIndex\u0022,{get:function(){return this.lastIndex},set:function(e){this.lastIndex=e}})};m();var J=function(){var e=Array.prototype.slice.call(arguments);e.unshift(Date);return new(Function.prototype.bind.apply(Date,e))};var B=function(){var e=Array.prototype.slice.call(arguments);e.unshift(RegExp);return new(Function.prototype.bind.apply(RegExp,e))};var Y={};Y.nv_log=function(){var e=\u0022WXSRT:\u0022;for(var t=0;t<arguments.length;++t)e+=arguments[t]+\u0022 \u0022;console.log(e)};var G=parseInt,X=parseFloat,H=isNaN,V=isFinite,$=decodeURI,W=decodeURIComponent,Q=encodeURI,q=encodeURIComponent;function K(e,t,r){e=A.rv(e);if(e===null||e===undefined)return e;if(e.constructor===String||e.constructor===Boolean||e.constructor===Number)return e;if(e.constructor===Object){var n={};for(var o in e)if(e.hasOwnProperty(o))if(undefined===t)n[o.substring(3)]=K(e[o],t,r);else n[t+o]=K(e[o],t,r);return n}if(e.constructor===Array){var n=[];for(var a=0;a<e.length;a++)n.push(K(e[a],t,r));return n}if(e.constructor===Date){var n=new Date;n.setTime(e.getTime());return n}if(e.constructor===RegExp){var i=\u0022\u0022;if(e.global)i+=\u0022g\u0022;if(e.ignoreCase)i+=\u0022i\u0022;if(e.multiline)i+=\u0022m\u0022;return new RegExp(e.source,i)}if(r&&e.constructor===Function){if(r==1)return K(e(),undefined,2);if(r==2)return e}return null}var Z={};Z.nv_stringify=function(e){JSON.stringify(e);return JSON.stringify(K(e))};Z.nv_parse=function(e){if(e===undefined)return undefined;var t=JSON.parse(e);return K(t,\u0022nv_\u0022)};function ee(e,t,r,n){e.extraAttr={t_action:t,t_rawid:r};if(typeof n!=\u0022undefined\u0022)e.extraAttr.t_cid=n}function te(){if(typeof window.__webview_engine_version__==\u0022undefined\u0022)return 0;return window.__webview_engine_version__}function re(e,t,r,n,o,a){var i=ne(t,r,n);if(i)e.push(i);else{e.push(\u0022\u0022);u(n+\u0022:import:\u0022+o+\u0022:\u0022+a+\u0022: Path `\u0022+t+\u0022` not found from `\u0022+n+\u0022`.\u0022)}}function ne(e,t,r){if(e[0]!=\u0022/\u0022){var n=r.split(\u0022/\u0022);n.pop();var o=e.split(\u0022/\u0022);for(var a=0;a<o.length;a++){if(o[a]==\u0022..\u0022)n.pop();else if(!o[a]||o[a]==\u0022.\u0022)continue;else n.push(o[a])}e=n.join(\u0022/\u0022)}if(r[0]==\u0022.\u0022&&e[0]==\u0022/\u0022)e=\u0022.\u0022+e;if(t[e])return e;if(t[e+\u0022.wxml\u0022])return e+\u0022.wxml\u0022}function oe(e,t,r,n){if(!t)return;if(n[e][t])return n[e][t];for(var o=r[e].i.length-1;o>=0;o--){if(r[e].i[o]&&n[r[e].i[o]][t])return n[r[e].i[o]][t]}for(var o=r[e].ti.length-1;o>=0;o--){var a=ne(r[e].ti[o],r,e);if(a&&n[a][t])return n[a][t]}var i=ae(r,e);for(var o=0;o<i.length;o++){if(i[o]&&n[i[o]][t])return n[i[o]][t]}for(var p=r[e].j.length-1;p>=0;p--)if(r[e].j[p]){for(var a=r[r[e].j[p]].ti.length-1;a>=0;a--){var u=ne(r[r[e].j[p]].ti[a],r,e);if(u&&n[u][t]){return n[u][t]}}}}function ae(e,t){if(!t)return[];if($gaic[t]){return $gaic[t]}var r=[],n=[],o=0,a=0,i={},p={};n.push(t);p[t]=true;a++;while(o<a){var u=n[o++];for(var l=0;l<e[u].ic.length;l++){var f=e[u].ic[l];var v=ne(f,e,u);if(v&&!p[v]){p[v]=true;n.push(v);a++}}for(var l=0;u!=t&&l<e[u].ti.length;l++){var c=e[u].ti[l];var s=ne(c,e,u);if(s&&!i[s]){i[s]=true;r.push(s)}}}$gaic[t]=r;return r}var ie={};function pe(e,t,r,n,o,a,i){var p=ne(e,t,r);t[r].j.push(p);if(p){if(ie[p]){u(\u0022-1:include:-1:-1: `\u0022+e+\u0022` is being included in a loop, will be stop.\u0022);return}ie[p]=true;try{t[p].f(n,o,a,i)}catch(n){}ie[p]=false}else{u(r+\u0022:include:-1:-1: Included path `\u0022+e+\u0022` not found from `\u0022+r+\u0022`.\u0022)}}function ue(e,t,r,n){u(t+\u0022:template:\u0022+r+\u0022:\u0022+n+\u0022: Template `\u0022+e+\u0022` not found.\u0022)}function le(e){var t=false;delete e.properities;delete e.n;if(e.children){do{t=false;var r=[];for(var n=0;n<e.children.length;n++){var o=e.children[n];if(o.tag==\u0022virtual\u0022){t=true;for(var a=0;o.children&&a<o.children.length;a++){r.push(o.children[a])}}else{r.push(o)}}e.children=r}while(t);for(var n=0;n<e.children.length;n++){le(e.children[n])}}return e}function fe(e){if(e.tag==\u0022wx-wx-scope\u0022){e.tag=\u0022virtual\u0022;e.wxCkey=\u002211\u0022;e[\u0022wxScopeData\u0022]=e.attr[\u0022wx:scope-data\u0022];delete e.n;delete e.raw;delete e.generics;delete e.attr}for(var t=0;e.children&&t<e.children.length;t++){fe(e.children[t])}return e}return{a:D,b:S,c:v,d:e,e:t,f:u,g:r,h:s,i:n,j:o,k:A,l:T,m:a,n:f,o:c,p:i,q:y,r:N,s:b,t:d,u:h,v:p,w:l,x:_,y:w,z:O,A:j,B:P,C:M,D:J,E:B,F:Y,G:G,H:X,I:H,J:V,K:$,L:W,M:Q,N:q,O:K,P:Z,Q:ee,R:te,S:re,T:ne,U:oe,V:ae,W:ie,X:pe,Y:ue,Z:le,aa:fe}}()});Object.freeze(__g);g=\u0022\u0022;/*v0.5vv_20200413_syb_scopedata*/window.__wcc_version__='v0.5vv_20200413_syb_scopedata';window.__wcc_version_info__={\u0022customComponents\u0022:true,\u0022fixZeroRpx\u0022:true,\u0022propValueDeepCopy\u0022:false};\u000avar $gwxc\u000avar $gaic={}\u000a" +
        funcName +
        "=function(_,_v,_n,_p,_s,_wp,_wl,$gwn,$gwl,$gwh,wh,$gstack,$gwrt,gra,grb,TestTest,wfor,_ca,_da,_r,_rz,_o,_oz,_1,_1z,_2,_2z,_m,_mz,nv_getDate,nv_getRegExp,nv_console,nv_parseInt,nv_parseFloat,nv_isNaN,nv_isFinite,nv_decodeURI,nv_decodeURIComponent,nv_encodeURI,nv_encodeURIComponent,$gdc,nv_JSON,_af,_gv,_ai,_grp,_gd,_gapi,$ixc,_ic,_w,_ev,_tsd){return function(path,global){\u000aif(typeof global==='undefined'){if (typeof __GWX_GLOBAL__==='undefined')global={};else global=__GWX_GLOBAL__;}if(typeof __WXML_GLOBAL__ === 'undefined') {__WXML_GLOBAL__={};\u000a}__WXML_GLOBAL__.modules = __WXML_GLOBAL__.modules || {};\u000a";

    // 函数名不是$gwx的时候，需要初始化操作
    if (funcName !== "$gwx") common += "$gwx('init', global);\u000a";
    common +=
        "var e_={}\u000aif(typeof(global.entrys)==='undefined')global.entrys={};e_=global.entrys;\u000avar d_={}\u000aif(typeof(global.defines)==='undefined')global.defines={};d_=global.defines;\u000avar f_={}\u000aif(typeof(global.modules)==='undefined')global.modules={};f_=global.modules || {};\u000avar p_={}\u000a";

    // cs
    const cs = source.match(/var cs([\s\S]*?)function gz/);
    common += "var cs" + cs[1];

    const depsData = parseDeps(source, x, pageConfig, funcName);
    common += depsData.dep_gz;
    // nv_require
    const nv_require = source.match(
        new RegExp(
            `(__WXML_GLOBAL__\\.ops_set\\.\\${funcName}=[\\s\\S]*)var x=\\[`
        )
    );
    common += nv_require[1];

    common += depsData.dep_x + depsData.dep_d_;
    common +=
        "if(path&&e_[path]){\u000awindow.__wxml_comp_version__=0.02\u000areturn function(env,dd,global){$gwxc=0;var root={\u0022tag\u0022:\u0022wx-page\u0022};root.children=[]\u000a;g=\u0022" +
        funcName +
        "\u0022;var main=e_[path].f\u000acs=[]\u000aif (typeof global===\u0022undefined\u0022)global={};global.f=$gdc(f_[path],\u0022\u0022,1);\u000aif(typeof(window.__webview_engine_version__)!='undefined'&&window.__webview_engine_version__+1e-6>=0.02+1e-6&&window.__mergeData__)\u000a{\u000aenv=window.__mergeData__(env,dd);\u000a}\u000atry{\u000amain(env,{},root,global);\u000a_tsd(root)\u000aif(typeof(window.__webview_engine_version__)=='undefined'|| window.__webview_engine_version__+1e-6<0.01+1e-6){return _ev(root);}\u000a}catch(err){\u000aconsole.log(cs, env);\u000aconsole.log(err)\u000athrow err\u000a}\u000a;g=\u0022\u0022;\u000areturn root;\u000a}\u000a}\u000a}\u000a}(__g.a,__g.b,__g.c,__g.d,__g.e,__g.f,__g.g,__g.h,__g.i,__g.j,__g.k,__g.l,__g.m,__g.n,__g.o,__g.p,__g.q,__g.r,__g.s,__g.t,__g.u,__g.v,__g.w,__g.x,__g.y,__g.z,__g.A,__g.B,__g.C,__g.D,__g.E,__g.F,__g.G,__g.H,__g.I,__g.J,__g.K,__g.L,__g.M,__g.N,__g.O,__g.P,__g.Q,__g.R,__g.S,__g.T,__g.U,__g.V,__g.W,__g.X,__g.Y,__g.Z,__g.aa);if(__vd_version_info__.delayedGwx||true)" +
        funcName +
        "();;var __WXML_DEP__=__WXML_DEP__||{};";
    // 追加引用
    let common_end = "";
    for (let key in pageConfig) {
        if (pageConfig[key].deps.length > 0) {
            common_end += `__WXML_DEP__["./${key}.wxml"]=["${pageConfig[
                key
            ].deps.join('","')}",];`;
        }
    }
    common += common_end;
    return common;
}
/**
 * 获取 wxml 编译器路径
 */
let wxmlParserPath = "";
function getWXMLParsePath() {
    if (wxmlParserPath) return wxmlParserPath;

    const fileName =
        process.platform === "darwin"
            ? "../bin/mac/wcc"
            : process.platform === "linux"
            ? "../bin/linux/wcc"
            : "../bin/windows/wcc.exe";
    wxmlParserPath = path.join(__dirname, fileName);

    // 尝试修改权限
    try {
        fs.chmodSync(wxmlParserPath, 0o777);
    } catch (err) {
        // ignore
    }

    return wxmlParserPath;
}

/**
 * 获取自定义组件编译参数
 */
function getComponentArgs(files) {
    let args = [];
    let count = 0;

    files.forEach((file) => {
        const fileJson = file.fileJson;

        if (fileJson.usingComponents) {
            args.push(file.pagePath);
            args.push(Object.keys(fileJson.usingComponents).length);
            args = args.concat(Object.keys(fileJson.usingComponents));
            count++;
        }
    });
    args.unshift(count);

    return args;
}

/**
 * 获取完整文件列表，包括自定义组件
 */
function getAllFiles(rootPath, files) {
    const ret = [];
    const hasCheckMap = {};

    for (let i = 0, len = files.length; i < len; i++) {
        const file = files[i];

        let fileJson = {};
        const realPath = path.join(rootPath, file);
        if (hasCheckMap[realPath]) continue;
        hasCheckMap[realPath] = true;
        try {
            fileJson = require(`${realPath}.json`);
        } catch (err) {
            // ignore
        }

        // 自定义组件
        if (fileJson.usingComponents) {
            Object.keys(fileJson.usingComponents).forEach((subFileKey) => {
                const subFile = fileJson.usingComponents[subFileKey];

                len++;

                let relativePath = path.relative(
                    rootPath,
                    path.join(path.dirname(realPath), subFile)
                );
                relativePath = relativePath.replace(/\\/g, "/");
                files.push(relativePath);
            });
        }

        ret.push({
            pagePath: `${file}.wxml`,
            jsonPath: `${file}.json`,
            fileJson,
        });
    }

    return ret;
}

/**
 * 入口
 * 编译 wxml 到 js
 *  files
 *
 * @param {*} options 配置选项
 * @returns String or Object with lazyload
 */
function wxmlToJS(options = {}) {
    // 创建临时目录
    const tmp = nfs.mkdtempSync(path.join(os.tmpdir(), "wcc_"));
    // 判断是否replace,是写入replace,否则拷贝文件到临时目录
    for (let file of options.files) {
        if (typeof options.replaceContent[file] === "string") {
            // 写入替换内容
            nfs.mkdirSync(path.dirname(path.resolve(tmp, file)), {
                recursive: true,
            });
            nfs.writeFileSync(
                path.resolve(tmp, file),
                options.replaceContent[file]
            );
        } else {
            // 复制原文件
            nfs.mkdirSync(path.dirname(path.resolve(tmp, file)), {
                recursive: true,
            });
            nfs.copyFileSync(
                path.resolve(options.cwd, file),
                path.resolve(tmp, file)
            );
        }
    }
    // 使用临时目录执行wcc
    options.cwd = tmp;

    let rootPath = options.cwd;
    let files = options.files;
    let cut = options.isCut;
    const type = cut ? "-xc" : "-cc";
    // files = getAllFiles(rootPath, files)

    // @TODO，如果遇到参数过长被操作系统干掉的情况，可以使用 --config-path FILE 配置，参数空格换成空行
    // const componentArgs = getComponentArgs(files), componentArgs.join(' ')
    let args = [
        "-d",
        "--split",
        options.wxmlCompileConfigSplit,
        type,
        options.wxmlCompileConfig,
    ]
        .concat(files)
        .concat(["-gn", options.genfuncname || "$gwx"]);

    // wxs调试
    if (options.debugWXS) args.unshift("-ds");
    // 懒加载
    // if(options.lazyload)args=args.concat(['-ll', options.lazyloadConfig])

    // wxmlParserPath 二进制可执行文件路径
    const wxmlParserPath = getWXMLParsePath();
    // console.warn('wcc args:', args)
    const wcc = spawnSync(wxmlParserPath, args, { cwd: rootPath });

    nfs.rmSync(tmp, { recursive: true, force: true });
    if (wcc.status === 0) {
        let result = wcc.stdout.toString();
        DEBUG_OUTPUT &&
            fs.writeFileSync(`${DEBUG_OUTPUT}/linux_output.js`, result);

        if (options.lazyload) {
            // 懒加载处理
            const str = result;
            const resultObj = {
                generateFunctionName: {
                    __COMMON__: options.genfuncname,
                },
                generateFunctionContent: {
                    __COMMON__: null,
                },
            };

            const needArr = options.wxmlCompileConfig.split(
                options.wxmlCompileConfigSplit
            );
            const indexArr = eval(str.match(/var x=(\[.*\]);/)[1]);
            const pageConfig = {};
            let i = 0;
            indexArr.forEach((ele, index) => {
                if (!ele.startsWith("../")) {
                    pageConfig[ele.substring(2, ele.length - 5)] = {
                        funcName: `${options.genfuncname}_XC_${i}`,
                        num: i,
                        deps: [],
                    };
                    i++;
                }
            });
            // 引入解析
            const deps = str.matchAll(
                /_ai\(.*?,x\[(\d+)\],.*?,x\[(\d+)\],\d+,\d+\)/g
            );
            for (let dep of deps) {
                // console.log(dep[1]) // 被引用文件下标
                // console.log(dep[2]) // 引用文件下标
                const target = indexArr[dep[2]];
                pageConfig[target.substring(2, target.length - 5)].deps.unshift(
                    "./" + path.join(path.dirname(target), indexArr[dep[1]])
                );
            }
            for (let key in pageConfig) {
                if (needArr.includes(`./${key}.wxml`)) {
                    resultObj.generateFunctionName[key] =
                        pageConfig[key].funcName;
                    resultObj.generateFunctionContent[key] =
                        genFunctionContent_LL(
                            key,
                            pageConfig[key],
                            str,
                            options.genfuncname,
                            indexArr
                        );
                }
            }
            resultObj.generateFunctionContent.__COMMON__ = genCommonContent_LL(
                str,
                options.genfuncname,
                pageConfig,
                indexArr
            );
            // console.log(pageConfig)
            result = resultObj;
        }
        return result;
    } else {
        throw new Error(`编译 .wxml 文件错误：${wcc.stderr.toString()}`);
    }
}

module.exports = wxmlToJS;
