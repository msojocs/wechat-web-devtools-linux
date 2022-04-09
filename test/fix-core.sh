#!/bin/bash
root_dir=$(cd `dirname $0`/.. && pwd -P)

package_dir="$root_dir/package.nw"
tmp_dir="$root_dir/package.nw"
mkdir -p $tmp_dir
unpack_script="$root_dir/tools/wxvpkg_unpack.js"
pack_script="$root_dir/tools/wxvpkg_pack.js"
 
find_result=$( grep -lr "OSThemeController=" "$tmp_dir/core.wxvpkg.ext" )
echo "theme: $find_result"
sed -i 's/"use strict";O/"use strict";const {execSync,spawn}=require("child_process");O/' $find_result
sed -i 's/this.registerListeners()/this.monitorTheme()/' $find_result
sed -i 's/}registerListeners/}monitorTheme(){let monitor=null;const{DESKTOP_SESSION}=process.env;switch(DESKTOP_SESSION){case"deepin":monitor=spawn("gsettings",["monitor","com.deepin.dde.appearance","gtk-theme",]);break;case"gnome":case"gnome-classic":monitor=spawn("gsettings",["monitor","org.gnome.desktop.interface","gtk-theme",]);break;default:console.warn(`NOT SUPPORTED!!!DESKTOP_SESSION:${DESKTOP_SESSION}`);break}monitor\&\&monitor.on("error",(err)=>{console.error("monitorTheme",err)});monitor\&\&monitor.stdout.on("data",e.debounce((chunk)=>{const data=chunk.toString();const t=data.includes("dark");console.warn(data);console.warn("dark",t);(this._theme=t?i.Dark:i.Light),this._onDidThemeChange.fire(this._theme)},400))}registerListeners/' $find_result
sed -i 's/mediaQuery.matches/isDark/' $find_result
sed -i 's/}getDefaultTheme/}get isDark(){const{DESKTOP_SESSION}=process.env;console.log(DESKTOP_SESSION);let theme="";switch(DESKTOP_SESSION){case"deepin":theme=execSync(`gsettings get com.deepin.dde.appearance gtk-theme`);break;case"gnome":case"gnome-classic":theme=execSync(`gsettings get org.gnome.desktop.interface gtk-theme`);break;default:break}return theme.includes("dark")}getDefaultTheme/' $find_result