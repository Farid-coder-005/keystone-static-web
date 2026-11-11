/*!
 * SmartMenus jQuery Plugin Bootstrap 4 Addon - v0.1.0 - September 17, 2017
 * http://www.smartmenus.org/
 *
 * Copyright Vasil Dinkov, Vadikom Web Ltd.
 * http://vadikom.com
 *
 * Licensed MIT
 */
(function(factory){if(typeof define==='function'&&define.amd){define(['jquery','smartmenus'],factory)}else if(typeof module==='object'&&typeof module.exports==='object'){module.exports=factory(require('jquery'))}else{factory(jQuery)}}(function($){$.extend($.SmartMenus.Bootstrap={},{keydownFix:!1,init:function(){var $navbars=$('ul.navbar-nav:not([data-sm-skip])');$navbars.each(function(){var $this=$(this),obj=$this.data('smartmenus');if(!obj){var skipBehavior=$this.is('[data-sm-skip-collapsible-behavior]'),rightAligned=$this.hasClass('ml-auto')||$this.prevAll('.mr-auto').length>0;$this.smartmenus({subMenusSubOffsetX:2,subMenusSubOffsetY:-9,subIndicators:!skipBehavior,collapsibleShowFunction:null,collapsibleHideFunction:null,rightToLeftSubMenus:rightAligned,bottomToTopSubMenus:$this.closest('.fixed-bottom').length>0,bootstrapHighlightClasses:'text-dark bg-light'}).on({'show.smapi':function(e,menu){var $menu=$(menu),$scrollArrows=$menu.dataSM('scroll-arrows');if($scrollArrows){$scrollArrows.css('background-color',$menu.css('background-color'))}
$menu.parent().addClass('show');if(obj.opts.keepHighlighted&&$menu.dataSM('level')>2){$menu.prevAll('a').addClass(obj.opts.bootstrapHighlightClasses)}},'hide.smapi':function(e,menu){var $menu=$(menu);$menu.parent().removeClass('show');if(obj.opts.keepHighlighted&&$menu.dataSM('level')>2){$menu.prevAll('a').removeClass(obj.opts.bootstrapHighlightClasses)}}});obj=$this.data('smartmenus');function onInit(){$this.find('a.current').each(function(){var $this=$(this);($this.hasClass('dropdown-item')?$this:$this.parent()).addClass('active')});$this.find('a.has-submenu').each(function(){var $this=$(this);if($this.is('[data-toggle="dropdown"]')){$this.dataSM('bs-data-toggle-dropdown',!0).removeAttr('data-toggle')}
if(!skipBehavior&&$this.hasClass('dropdown-toggle')){$this.dataSM('bs-dropdown-toggle',!0).removeClass('dropdown-toggle')}})}
onInit();function onBeforeDestroy(){$this.find('a.current').each(function(){var $this=$(this);($this.hasClass('active')?$this:$this.parent()).removeClass('active')});$this.find('a.has-submenu').each(function(){var $this=$(this);if($this.dataSM('bs-dropdown-toggle')){$this.addClass('dropdown-toggle').removeDataSM('bs-dropdown-toggle')}
if($this.dataSM('bs-data-toggle-dropdown')){$this.attr('data-toggle','dropdown').removeDataSM('bs-data-toggle-dropdown')}})}
obj.refresh=function(){$.SmartMenus.prototype.refresh.call(this);onInit();detectCollapsible(!0)};obj.destroy=function(refresh){onBeforeDestroy();$.SmartMenus.prototype.destroy.call(this,refresh)};if(skipBehavior){obj.opts.collapsibleBehavior='toggle'}
var winW;function detectCollapsible(force){var newW=obj.getViewportWidth();if(newW!=winW||force){if(obj.isCollapsible()){$this.addClass('sm-collapsible')}else{$this.removeClass('sm-collapsible')}
winW=newW}}
detectCollapsible();$(window).on('resize.smartmenus'+obj.rootId,detectCollapsible)}});if($navbars.length&&!$.SmartMenus.Bootstrap.keydownFix){$(document).off('keydown.bs.dropdown.data-api','.dropdown-menu');if($.fn.dropdown&&$.fn.dropdown.Constructor&&$.fn.dropdown.Constructor._dataApiKeydownHandler){$(document).on('keydown.bs.dropdown.data-api','.dropdown-menu.show',$.fn.dropdown.Constructor._dataApiKeydownHandler)}
$.SmartMenus.Bootstrap.keydownFix=!0}}});$($.SmartMenus.Bootstrap.init);return $}))