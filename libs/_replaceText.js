'use strict';

function replaceText(obj){
	let replaceText = JSON.stringify(obj);
	replaceText = replaceText.replace(/@_@/g, '/');
	replaceText = replaceText.replace(/<br>/gi, " ");
	replaceText = replaceText.replace(/<br\s\/>/gi, " ");
	replaceText = replaceText.replace(/<br\/>/gi, " ");
	replaceText = replaceText.replace(/<p[^>]*>/gi, " ");
	replaceText = replaceText.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1)");
	replaceText = replaceText.replace(/<script.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/script>/gi, "");
	replaceText = replaceText.replace(/<style.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/style>/gi, "");
	replaceText = replaceText.replace(/<(?:.|\s)*?>/g, "");
	replaceText = replaceText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, " ");
	replaceText = replaceText.replace(/ +(?= )/g,'');
	replaceText = replaceText.replace(/&nbsp;/gi," ");
	replaceText = replaceText.replace(/&amp;/gi,"&");
	replaceText = replaceText.replace(/&quot;/gi,'"');
	replaceText = replaceText.replace(/&lt;/gi,'<');
	replaceText = replaceText.replace(/&gt;/gi,'>');
	replaceText = replaceText.replace(/<\s*br\/*>/gi, " ");
	replaceText = replaceText.replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
	replaceText = replaceText.replace(/<\s*\/*.+?>/ig, " ");
	replaceText = replaceText.replace(/ {2,}/gi, " ");
	replaceText = replaceText.replace(/\n+\s*/gi, " ");
	replaceText = replaceText.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
	replaceText = JSON.parse(replaceText);
	return replaceText;
};

module.exports = replaceText;