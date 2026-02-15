"use strict";
{
    const createElement = document.createElement
    document.createElement = function (tagName) {
        const instance = createElement.call(document, tagName)
        if (tagName === 'iframe') {
            instance.setAttribute('nwdisable', 'true')
        }
        return instance
    }
}