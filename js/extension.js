
(function() {
  class candleTheme extends window.Extension {
    constructor() {
      super('candle-theme');
      
      
      /*
      (function(history) {
          var pushState = history.pushState;
          history.pushState = function(state) {
              if (typeof history.onpushstate == "function") 
              {
                  history.onpushstate({
                      state: state
                  });
              }
              return pushState.apply(history, arguments);
          }
      })(window.history);
      */
      
      var pushState = history.pushState;
      history.pushState = function(state) {
          if (typeof history.onpushstate == "function") 
          {
              history.onpushstate({
                  state: state
              });
          }
          return pushState.apply(history, arguments);
      }
      
      
      //console.log("window: ", window);
      //console.log("API: ", API);
      //console.log("models: ", models);
      //console.log("APP: ", app);
      
      //console.log("addon settings: ", window.API.getAddonConfig("candleappstore"));
      this.debug = false;
      
      this.things; // later holds data from window.API.getThings()
      
      this.check_properties_scheduled == false;
	  this.devices_with_logs = [];
      this.api_logs; // later becomes array
      this.log_collections = {};
      this.kiosk = false; // If running on the built-in kiosk browser (indicated by the virtual keyboard existing)
      this.exhibit_mode = false;
      
      //console.log("hostname: ",window.location.hostname);
      //console.log("origin: ", window.location.origin);
      //console.log("double: ", window.location.origin+window.location.pathname);
      //console.log(location.href = window.location.origin + '/wifi-setup');
      //console.log(window.location.origin + '/wifi-setup');
      
      /*
      console.log("attempting window resize");
      window.resizeBy(-200, -200);
      var evt = document.createEvent('UIEvents');
      evt.initUIEvent('resize', true, false,window,0);
      window.dispatchEvent(evt);
      //window.resizeBy(200, 200);
      */
      
      //console.log(localStorage.getItem('background_color'));
      
      // Background color is also stored in browser local storage, since it's faster
      //document.addEventListener('DOMContentLoaded', function GetFavColor() {
      //    console.log("document loaded");
      //});
      
      var color = localStorage.getItem('background_color');
      //console.log('background color from local storage: ', color);
      if (color != '' && color != null) {
          document.body.style.backgroundColor = color;
          document.querySelector ("html").style.backgroundColor = color;
          document.querySelector ("#main-menu").style.backgroundColor = color;
      }
      
      
      if(document.getElementById('things').innerHTML == 'No devices yet. Click + to scan for available devices.' || document.getElementById('things').innerHTML == ''){
          
          document.getElementById('things').innerHTML = '<div id="extension-candle-theme-things-wait-message"><h1>Still starting</h1><p>Please wait a minute</p></div>';
          document.getElementById('things').style.opacity = '1';
          try{
              navigator.brave.isBrave().then(response => {
                  if(response){
                      //console.log("Brave detected");
                      document.getElementById('things').innerHTML = '<div id="extension-candle-theme-things-wait-message"><h1>Still starting</h1><p>Make sure Brave shields are disabled.</p></div>';
                  }
              })
          }
          catch(e){
              console.log("Brave not detected: ", e);
          }
      }
      
      
      /*
      if (localStorage.getItem("smallKeyboard") === null) {
          console.log('no smallKeyboard in local storage');
      }
      else{
          document.body.style.backgroundColor = "orange";
      }
      */
      
      if(document.getElementById('virtualKeyboardChromeExtension') != null){
          document.body.classList.add('kiosk');
          this.kiosk = true;
          
          document.getElementById('virtualKeyboardChromeExtension').style.width = '100vw';
          
          // Block all outgoing links on the kiosk
          document.addEventListener(`click`, e => {
              const origin = e.target.closest("a");
              //console.log(e);
              
          
              if(event.target.classList.contains('addon-settings-license')){
                  //console.log("clicked on a license link on the settings page");
                  e.preventDefault();
                  alert("Sorry, you cannot open links to other websites here. Connect with a browser on your phone, tablet or computer instead.");
              }
              
              else if(event.target.tagName.toLowerCase() === 'a'){
                  //console.log("click on an A tag");
                  if( event.target.getAttribute("target") == "_blank"){
                      e.preventDefault();
                      //console.log("Blocking external link from opening since kiosk mode is active");
                      alert("Sorry, you cannot open links to other websites here. Connect with a browser on your phone, tablet or computer instead.");
                  }
              }
              else if (origin) {
                  if( origin.getAttribute("target") == "_blank"){
                      e.preventDefault();
                      //console.log("Blocking external link from opening since kiosk mode is active");
                      alert("Sorry, you cannot open links to other websites here. Connect with a browser on your phone, tablet or computer instead.");
                  }
                  //console.clear();
                  //console.log(`You clicked ${origin.href}`);
              }
          });
      }
      
      
      
      
      
      
      // Create observers for the things overview
      this.observer = new MutationObserver(this.thingsMutationCallback.bind(this));
      this.observer.observe(
        document.getElementById('things'),
        {childList: true}
      );
      
      if( document.getElementById('groups') != null ){
          this.observer.observe(
            document.getElementById('groups'),
            {childList: true}
          );
      }

      
      this.shadow_observer = new MutationObserver(this.shadowMutationCallback.bind(this));
      
      // upgrade the style of messages that can show up in the bottom of the window
      this.message_area_observer = new MutationObserver(this.messageAreaCallback.bind(this));
      this.message_area_observer.observe(
        document.getElementById('message-area'),
        {childList: true}
      );
      
      this.last_mutation_activation_time = 0;
      this.shadow_mutation_counter = 0;
      this.developer_clicks = 0;
      
      //this.check_keyboard = false;
      this.previous_document_location = window.location.pathname;
    
      
  
      /*
      API.getPlatform().then((platform) => {
          console.log('Theme: API: platform: ', platform);
      });
      
      API.getThings().then((things) => {
          console.log('Theme:API: things: ', things);
      });
      
      API.getThing('device_id_here').then((thing) => {
          console.log('Theme:API: thing: ', thing);
      });
      
      try{
          if(typeof API.getGroups === 'function') {
              API.getGroups().then((groups) => {
                  //console.log('groups: ', groups);
              });
          }
      }
      catch(e){
          //console.log("Api test error: ", e);
      }

      
      API.getAddonsInfo().then((addons) => {
          //console.log('Theme: API: addons: ', addons);
      });
      
      
      API.getInstalledAddons().then((addons) => {
          //console.log('addons: ', addons);
      });
      
      
      API.getExtensions().then((extensions) => {
          //console.log('extensions: ', extensions);
      });
      
      
      API.getAllUserInfo().then((user_info) => {
          //console.log('user_info: ', user_info);
      });
      */
      
      var remove_group_question = document.createElement('div');
      remove_group_question.setAttribute("id", "candle-theme-remove-group-question");
      remove_group_question.innerHTML = "This will move things out of this group and then remove it";
      
      
      const group_remove_view = document.getElementById('group-context-menu-content-remove');
      if(group_remove_view != null){
          document.getElementById('group-context-menu-content-remove').prepend(remove_group_question);
      }
      
      
      document.addEventListener('keyup', (event) => {
          /*
          if (document.activeElement.tagName === "INPUT"){
              return;
          }
          */
          //console.log("keyboard UP: ", event);
          const code = event.keyCode || event.charCode;
          //console.log("up code: " + code);
          //console.log("document.activeElement.tagName: ", document.activeElement.tagName);
          
          if(document.location.href.endsWith("/things") && document.getElementById('add-thing-screen').classList.contains('hidden')){
              this.things_overview_search(code);
          }
          else if(document.location.href.indexOf("/things/") != -1 && document.activeElement.tagName !== "INPUT" && !document.activeElement.tagName.startsWith('WEBTHING-') && code == 8){
              document.getElementById('back-button').click();
          }
      });
          
      document.addEventListener('keydown', (event) => {
          /*
          if (document.activeElement.tagName === "INPUT"){
              return;
          }
          */
          //console.log("keyboard DOWN: ", event);
          //console.log("document.activeElement.tagName: " + document.activeElement.tagName);
          
          if(document.location.href.endsWith("/things") && document.getElementById('add-thing-screen').classList.contains('hidden')){
              //console.log("keyboard 2");
              this.addThingsSearch();
              const search_input = document.getElementById('candle-theme-things-search-input');
              if(document.activeElement !== search_input){
                  //console.log("giving focus");
                  search_input.focus();
              }
          }
          else if(document.location.href.endsWith('/settings/addons/discovered')){
              //console.log('keypress at addons discovery:', event);
              if(document.activeElement !== document.getElementById('discovered-addons-search')){
                  //console.log("giving focus");
                  document.getElementById('discovered-addons-search').focus();
              }
              
          }
          else if(document.location.href.indexOf('/rules/') !== -1){
              //console.log('keypress at rules:', event);
              const code = event.keyCode || event.charCode;
              this.filter_rule_parts_list(code);
              
          }
          
          
          
          
      });
      
      
      
      
      try{
          document.getElementById('create-log-save-button').addEventListener('click', () => {
              console.log("create-log-save-button clicked");
              if(this.debug){
                  console.log("a new log was added");
              }
              this.on_new_page(false);
              this.update_logs_list();
          });
      
          /*
          document.querySelector('img[alt="Remove Icon"]').addEventListener('click', () => {
              if(this.debug){
                  console.log("Something was removed");
              }
              this.on_new_page(false);
          });
          */
      }
      catch(e){
          console.log("attaching to log add and remove buttons failed?: ", e);
      }
      
      
      
      document.querySelector('#settings-menu .section-title-icon').addEventListener('click', () => {
                    		//console.log("clicked on link to logs button. This:", this);
                            this.developer_clicks++;
                            /*
                            if(this.developer_clicks > 7){
                                document.body.classList.remove('developer');
                                this.developer_clicks = 0;
                            }
                            else 
                            */
                            if(this.developer_clicks > 3){
                                this.developer_clicks = 0;
                                if( document.body.classList.contains('developer') ){
                                    document.body.classList.remove('developer');
                                }
                                else{
                                    if(!this.exhibit_mode){
                                        document.body.classList.add('developer');
                                    }
                                    else{
                                        console.warn("Candle theme: cannot enable developer mode with 4 gear clicks: exhibit mode active");
                                    }
                                    
                                }
                                
                            }
                        });
      

      // This is for the virtual keyboard
      document.getElementById('network-settings-wifi-password').addEventListener('keyup', () => {
          console.log("document.getElementById('network-settings-wifi-password').value.length: ", document.getElementById('network-settings-wifi-password').value.length);
          if(document.getElementById('network-settings-wifi-password').value.length > 7){
              document.getElementById('network-settings-wifi-connect').disabled = false;
          }
      });           
      
      
      
      
      // Change logo
      //document.getElementById('menu-wordmark').src = '/extensions/candle-theme/images/candle-logo.svg';
      document.getElementById('menu-wordmark').alt = "Candle";
      //document.getElementById('menu-wordmark').classList.add("extension-candle-theme-candle-logo");
      
      //localStorage.setItem("candle_theme_log_collections", JSON.stringify({}));
      





      

      /*
      // Listen for changes in dropdowns
      const message_area = document.getElementById('message-area');
      //console.log(message_area);
      message_area.addEventListener("DOMCharacterDataModified", function (event) {
      //message_area.addEventListener('change', function(event) {
          //console.log(event);
          //console.log("message changed to: " + message_area.innerText);
          message_area.innertext = message_area.innerText + " ola";
      }, false);
      
      var mutato = new MutationObserver(function (e) {
        if (e[0].removedNodes) //console.log(1);
      });

      mutato.observe(document.getElementById('parent'), { childList: true });
      

      this.observer.observe(
        document.getElementById('message-area'),
        {childList: false}
      );
      */
      
      

      
      
      
      window.onpopstate = history.onpushstate = (event) => {
          
          try{
              if(this.debug){
                  console.log('\n\ntheme: page history has been modified!: ', event);
                  //console.log("\n\n NEW PATH: ", event.state.path);
              }
              this.on_new_page(false,event.state.path);
          }
          catch(e){
              console.error("Theme: error parsing window url change: ", e);
          }
          
      };
      
      
      
        
        this.on_new_page(true);
        
        
  		// /init
        window.API.postJson(
          `/extensions/${this.id}/api/ajax`,
            {'action':'init'}

        ).then((body) => {
			//console.log("Candle theme Init API result: ", body);
            
            if(typeof body.debug != 'undefined'){
                this.debug = body.debug;
                if(this.debug){
                    console.log("Candle theme: /init response: ", body);
                }
            }
            
            if(typeof body.exhibit_mode != 'undefined'){
                this.exhibit_mode = body.exhibit_mode;
            }
            
            if(typeof body.background_color != 'undefined'){
                if(body.background_color == ""){
                    body.background_color = 'transparent';
                    document.querySelector ("html").style.backgroundColor = 'transparent';
                    //document.querySelector ("#main-menu").style.backgroundColor = 'transparent';
                    try{
                        localStorage.removeItem('background_color');
                    }
                    catch(e){
                        console.log("Error while removing background color from local storage: ", e);
                    }
                    
                }
                else{
                    document.body.style.backgroundColor = body.background_color;
                    document.querySelector("html").style.backgroundColor = body.background_color;
                    document.querySelector("#main-menu").style.backgroundColor = body.background_color;
                    localStorage.setItem('background_color', body.background_color);
                }
                
            }
            else{
                try{
                    localStorage.removeItem('background_color');
                }
                catch(e){
                    //console.log("background color was not set in local storage, so won't be removed from it: ", e);
                }
            }
            
            if(typeof body.hide_floorplan != 'undefined'){
                if(body.hide_floorplan){
                    document.getElementById('floorplan-menu-item').style.display = 'none';
                }
            }
            
            if(typeof body.zoom != 'undefined' && typeof body.zoom_everywhere != 'undefined'){

                if(this.kiosk || body.zoom_everywhere){
                    if(body.zoom == '100%'){
                        document.body.classList.remove('zoom1');
                        document.body.classList.remove('zoom2');
                        document.body.classList.remove('zoom3');
                    }
                    else if(body.zoom == '120%'){
                        document.body.classList.remove('zoom2');
                        document.body.classList.remove('zoom3');
                        document.body.classList.add('zoom1');
                    }
                    else if(body.zoom == '140%'){
                        document.body.classList.remove('zoom1');
                        document.body.classList.remove('zoom3');
                        document.body.classList.add('zoom2');
                    }
                    else if(body.zoom == '160%'){
                        document.body.classList.remove('zoom1');
                        document.body.classList.remove('zoom2');
                        document.body.classList.add('zoom3');
                    }
                }
                
            }
            
            
            if(typeof body.allow_pinch_to_zoom != 'undefined'){
                if(body.allow_pinch_to_zoom == false){
                    const viewport = document.querySelector("meta[name=viewport]");
                    if(viewport != null){
                        //console.log('disabling pinch-to-zoom');
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                    }
                }
            }
            
            if(typeof body.hide_virtual_keyboard != 'undefined'){
                if(body.hide_virtual_keyboard == true){
                    document.body.classList.add('hide-virtual-keyboard');
                }
            }
            
            if(typeof body.menu_list != 'undefined'){
                if(body.menu_list == true){
                    document.body.classList.add('menu-list');
                }
            }
            
		
        }).catch((e) => {
  			console.log("Error getting Candle theme init data: ", e);
        });	
        
        

        //console.log("this.id: ", this.id);
        
    }
    
    
    
    
    

    
    
    
    // this only works for /things and its sub-pages
    on_new_page(just_arrived=false,page_url=null){
        if(this.debug){
            console.log("Candle theme: ON NEW PAGE:" + window.location.pathname);
        }
        
        
        var current_path = window.location.pathname;
        if(page_url != null){
            current_path = page_url;
        }
        
        if( current_path.startsWith('/things') ){
            //console.log("at /things or a sub-page" );
            
            this.addParts();
            
            if(current_path == '/things'){
                //console.log("at /things");
                
                // hide link to logs
                if(document.getElementById('candle-theme-link-to-logs-container') != null){
                    document.getElementById('candle-theme-link-to-logs-container').style.display = 'none';
                }
                
                // show search input
                if(document.getElementById('candle-theme-things-search-container') != null){
                    document.getElementById('candle-theme-things-search-input').value = '';
                    document.getElementById('candle-theme-things-search-container').style.display = 'block';
                }
                else if(document.getElementById("things").children.length > 10){
                    this.addThingsSearch();
                }
                
            }
            else{
                //console.log("ON A THING DETAIL PAGE");

                this.checkProperties(null, true);
                this.addThermostatButtons();
                //this.addShadowMutationsListener();
                if(just_arrived){
                    //console.log("using promise");
                    this.update_logs_list().then(() => {
                        //console.log("then add links to logs:");
                        this.add_link_to_logs();
                    });
                }
                else{
                    //console.log("no promise");
                    this.add_link_to_logs();
                }
                
                if(document.getElementById('candle-theme-things-search-container') != null){
                    //console.log("hiding search container");
                    document.getElementById('candle-theme-things-search-container').style.display = 'none';
                }
            }
            
        }
        
        else if( current_path.startsWith('/logs') ){
            //console.log("on /logs (or sub-page)");
            
            
            API.getThings().then((things) => {
                //console.log('Theme:API: things: ', things);
                this.things = things; // needed to figure out what type the various logs are
                
                this.update_logs_list().then(() => {
                    // In the future the filter checkboxes could be populated from the API?
                    //console.log("log list updated");
                })
                .finally(() =>{
                    //console.log("finally. current_path: ", current_path);
                    //this.add_log_filter_button();
    
                    //if( current_path.startsWith('/logs#') ){
                    if(window.location.href.indexOf('/logs#') !== -1){
                        //console.log("spotted a device id in the URL");
                        const paths = window.location.href.split("#").filter(entry => entry !== "");
                        const device_id = paths[paths.length - 1];
                        this.filter_logs_by_device(device_id);
                    }
    
                });
            });
            
            
            
            // Handle last-logs-view time
            window.API.postJson(
              `/extensions/${this.id}/api/ajax`,
                {'action':'get_last_logs_view_time'}

            ).then((body) => {
                //console.log("get_last_logs_view_time response: ", body);
                if(typeof body.last_log_view_time != 'undefined'){
                    if(body.last_log_view_time != null){
                        try{
                            if(document.getElementById('extension-candle-theme-last-logs-view-time-container') == null){
                    
                    			var last_logs_view_time_container_el = document.createElement("div");
                    			last_logs_view_time_container_el.setAttribute("id", "extension-candle-theme-last-logs-view-time-container");
			    
                    			last_logs_view_time_container_el.innerHTML = '<span>The logs were last viewed on </span><span id="extension-candle-theme-last-logs-view-time">...</span>';
                    			//new_log_filter_container.append(toggle);
                    			document.getElementById("logs-view").append(last_logs_view_time_container_el);
                            }
                            document.getElementById('extension-candle-theme-last-logs-view-time').innerText = body.last_log_view_time;
                        }
                        catch(e){
                            console.log("error adding/updating last_log_view_time_container: ", e);
                        }
                    }
                    
                }
                
            }).catch((e) => {
      			console.log("Error calling get_last_logs_view_time: ", e);
            });	
            
            window.setTimeout(() => {
                if(window.location.pathname == '/logs'){
                    if(this.debug){
                        console.log("theme: still on the log page 10 seconds later. Saving last log view time.");
                    }
                    
                    
                    window.API.postJson(
                      `/extensions/${this.id}/api/ajax`,
                        {'action':'save_last_logs_view_time'}

                    ).then((body) => {
                        if(this.debug){
                            console.log("theme: save_last_logs_view_time response: ", body);
                        }
		
                    }).catch((e) => {
              			console.log("Error calling save_last_logs_view_time: ", e);
                    });	
                    
                }
                else{
                    if(this.debug){
                        console.log("logs page was only visited momentarily");
                    }
                }
            }, 10000);
            
        }
        else{
            //console.log("ON SOME OTHER PAGE");
            //console.log(document.location.href);
            
        }
        
        
    }
    
    
    shadowMutationCallback(mutations){
        //console.log("in shadowMutationCallback. Mutations: ", mutations);
        if(Date.now() - 100 > this.last_mutation_activation_time){
            this.last_mutation_activation_time = Date.now();
            //console.log(this.shadow_mutation_counter);
            this.shadow_mutation_counter++;
            window.setTimeout(() => {
                //console.log("50ms have passed, calling check_properties");
                this.checkProperties();
            }, 50);
            
        }
        else{
            //console.log(" - ignoring shadow mutation callback.");
        }
    }
    
    /*
    addMutationsListener(element){
        this.observer = new MutationObserver(this.thingsMutationCallback.bind(this));
        this.observer.observe(
          document.getElementById('things'),
          {childList: true}
        );
    }
    */
    
    // gets logs data from window API, then updates devices_with_logs (which is used to link thing detail pages a filtered log page showing only that log). It also tries to generate the log filter sidebar.
    update_logs_list(){
        if(this.debug){
            console.log("in update_logs_list");
        }
        return new Promise((resolve, reject) => {

            API.getLogs().then((logs) => {
                if(this.debug){
                    console.log("theme: API.getlogs: ", logs);
                    console.log("theme: API.getthings: ", this.things);
                }
                
                this.create_quick_log_filter_buttons(logs,this.things);
                
                this.api_logs = logs;
                this.devices_with_logs = [];
            
                this.add_log_filter_button();
            
                for (var i=0;i<logs.length;i++){
                    //console.log( logs[i] );
                    //console.log( logs[i].thing);
                    this.devices_with_logs.push(logs[i].thing);
                }
                if(this.debug){
                    console.log("theme: updated list of devices with logs: ", this.devices_with_logs);
                }
                //window.location.pathname = '/logs';
            
                resolve();
            })
            .catch(() => {
                //console.log("error doing API.getLogs");
                reject();
            })
            .finally(() => {
                if(this.debug){
                    console.log("theme: logs: in API.getLogs finally");
                }
                this.add_log_filter_button();
            });
        
        });
    }


    // Adds a direct link from a device detail page to an overview of all the logs of a device.
    add_link_to_logs(device_id){
        if(this.debug){
            console.log("in add_link_to_logs, which adds a shortcut to logs on a thin details page");
        }
        device_id = this.get_device_id_from_url(device_id);
        if( this.devices_with_logs.includes(device_id)){
            //console.log(device_id + " has logs, adding direct link to them");
            if(document.getElementById('candle-theme-link-to-logs-container') == null){
    			const thing_view = document.getElementById("thing-view");
            
    			var new_log_link_container = document.createElement("div");
    			new_log_link_container.setAttribute("id", "candle-theme-link-to-logs-container");
                new_log_link_container.setAttribute("class", "candle-theme-link-to-logs-container-hidden candle-theme-top-right-icon");
			    
    			// Create log list toggle button
                //let log_link = document.createElement('div');
                //log_link.setAttribute("id", "candle-theme-link-to-logs-container");
    			new_log_link_container.innerHTML = '<a href="/logs#' + this.get_device_id_from_url() + '"><button id="candle-theme-link-to-logs-button" class="icon-button candle-theme-log-icon-button" data-l10n-id="menu-button" aria-label="View logs"></button>';
    			//new_log_filter_container.append(toggle);
    			document.getElementById("things-view").append(new_log_link_container);
                
                document.getElementById('candle-theme-link-to-logs-button').addEventListener('click', () => {
              		//console.log("clicked on link to logs button. This:", this);
                    
                    //document.getElementById('back-button').classList.add("hidden"); // DANGEROUS?
                    const device_id2 = this.get_device_id_from_url();
                    window.setTimeout(() => {
                        this.filter_logs_by_device(device_id2);
                    }, 300);
                    
                    //window.location.pathname = '/logs#' + device_id;
              	});
                
                
            }
            else{
                document.getElementById('candle-theme-link-to-logs-container').style.display = 'block';

            }
        }
    }

    // Button in the top-right of the logs page
    add_log_filter_button(){
        if(this.debug){
            console.log("theme: in add_log_filter_button");
        }
        /*
        const log_elements = document.querySelectorAll('.logs-log-container');
        if(log_elements.length < 7){
            //console.log('not enough log items to attach filter');
            return;
        }
        */
        
        //console.log("in add_log_filter_button");
		// Create log filter container
		var log_filter_container = document.getElementById("candle-theme-log-filter-container");
		if(!log_filter_container){
			//console.log("creating logs filter container");
            
			const logs_view = document.getElementById("logs-view");
            
			var new_log_filter_container = document.createElement("div");
			new_log_filter_container.setAttribute("id", "candle-theme-log-filter-container");
            new_log_filter_container.setAttribute("class", "candle-theme-log-filter-container-hidden");
			
			// Create log list toggle button
            let toggle = document.createElement('div');
            toggle.setAttribute("id", "candle-theme-log-list-toggle-container");
            toggle.setAttribute("class", "candle-theme-top-right-icon");
			toggle.innerHTML = '<button id="candle-theme-log-filter-button" class="icon-button candle-theme-log-filter-button" data-l10n-id="menu-button" aria-label="Log Filter"></button>';
			//new_log_filter_container.append(toggle);
			logs_view.append(toggle);
            
			// Create empty container that will hold the collections
            var new_collections_container = document.createElement("div");
            new_collections_container.setAttribute("id", "candle-theme-log-collections-container");
			new_log_filter_container.append(new_collections_container);
            
			// Create empty container that will hold the filter list
            var new_log_list_container = document.createElement("div");
            new_log_list_container.setAttribute("id", "candle-theme-log-list-container");
			new_log_filter_container.append(new_log_list_container);
			
			
			//console.log("appending to logs-view");
			logs_view.append(new_log_filter_container);
			
            
			log_filter_container = document.getElementById("candle-theme-log-filter-container");
            
            this.showLogCollections(); // adds the collection buttons at the top
            
            // delay no longer needed as the logs api is used instead of scanning the HTML. So much nicer and more robust now.
            /*
            window.setTimeout(() => {
                if(this.debug){
                    console.log("add_log_filter_button: waited two seconds, then called add_log_selector");
                }
                this.addLogSelector(); // add_log_filter_button -> 2 seconds later add the checkboxes list
            }, 1000);
            */
            this.addLogSelector();
            
    		//console.log("log_filter_container is now:");
    		//console.log(log_filter_container);
	
    		//Check if log filter toggle button is clicked
    		const log_filter_button = document.getElementById('candle-theme-log-filter-button');
          	log_filter_button.addEventListener('click', () => {
          		//console.log("clicked on log filter toggle button. This:", this);
            
    	        if (log_filter_container.classList.contains('candle-theme-log-filter-container-hidden')) {
    				log_filter_container.classList.remove('candle-theme-log-filter-container-hidden');
    		  	}
    			else{
    				log_filter_container.classList.add('candle-theme-log-filter-container-hidden');
    			}
            
    			const list = document.getElementById('candle-theme-log-list-ul');
    			//const buttons = document.getElementById('candle-theme-log-list-buttons');
    			if(list != null){
                    if(list.querySelectorAll("li").length == 0){
                        console.warn("there were no checkboxes yet? really?");
                        //this.showLogCollections(); // adds the collection buttons at the top
                        this.addLogSelector(); // tries to add the checkbox list if the filter button is clicked and the list is still empty
        			}
    			}
            
          	});
            
            
		}
		else{
		    //console.log("log_filter_button already existed");
		}
		
    }



    
    create_quick_log_filter_buttons(logs,things){
        if(this.debug){
            console.log("in create_quick_log_filter_buttons");
        }
        try{
            
            if(typeof things == 'undefined'){
                if(this.debug){
                    console.log("theme: create_quick_log_filter_buttons: things was not yet defined? Aborting");
                }
                return;
            }
            
            if(logs.length > 5){
                //console.log("enough logs");
                var buttons_data = {
                            'All':[{'thing':'fake1','property':'fake1'},{'thing':'fake2','property':'fake2'}],
                            'Temperature':[],
                            'Humidity':[],
                            'Air':[],
                            'Lux':[],
                            'Watt':[],
                            'kWh':[],
                            'Battery':[]
                            };
            
                // Create quick filter buttons container if it doesn't exist yet.
        		var quick_log_filter_container = document.getElementById("candle-theme-quick-log-filter-container");
        		if(quick_log_filter_container == null){
        			if(this.debug){
                        console.log("creating quick logs filter container");            
        			}
                    //const logs_view = document.getElementById("logs-view");
                
        			var quick_log_filter_container_el = document.createElement("div");
        			quick_log_filter_container_el.setAttribute("id", "candle-theme-quick-log-filter-container");
                    document.querySelector('#logs-view .logs').prepend(quick_log_filter_container_el);
                    quick_log_filter_container = document.getElementById("candle-theme-quick-log-filter-container");
                    if(this.debug){
                        //console.log("quick_log_filter_container is now: ", quick_log_filter_container);
                    }
                }
            
                for(let l = 0; l < logs.length; l++){
                    //console.log("log", l);
                    //console.log("q log: ", logs[l] );
                    //const log = logs[l];
                    // selectedCapability
                
                    try{
                    
                        for(let t = 0; t < things.length; t++){
                            //console.log("thing: ", things[t]);
                            
                            /*
                            var forms_type = "forms";
                            if( typeof things[t].links != 'undefined' ){
                                forms_type = "links";
                            }
                            */
                            /*
                            var forms_type = "links";
                            if( typeof things[t].forms != 'undefined' ){
                                forms_type = "forms";
                            }
                            console.log("forms_type: ", forms_type);
                            */
                            
                            //console.log("things[t][forms_type][0]['href']: ", things[t][forms_type][0]['href']);
                            if( things[t]['href'].endsWith("/" + logs[l]['thing']) ){
                                
                                const thing_title = things[t].title;
                                //console.log("found matching log thing");
                                const property_keys = Object.keys(things[t]['properties']);
                                for(let p = 0; p < property_keys.length; p++){
                                    const prop = things[t]['properties'][ property_keys[p] ];
                                    
                                    var forms_type = "links";
                                    if( typeof prop.forms != 'undefined' ){
                                        forms_type = "forms";
                                    }
                                    
                                    if( prop[forms_type][0]['href'].endsWith("/" + logs[l]['property']) ){
                                        
                                        if(this.debug){
                                            //console.log("quick logs filter: found property");
                                        }
                                        
                                        var button_type = null;
                                        if(typeof prop.unit != 'undefined'){
                                            
                                            //console.log("prop.unit: ", prop.unit);
                                            //console.log("prop.unit.toLowerCase(): ", prop.unit.toLowerCase());
                                            if(prop.unit.toLowerCase() == 'kwh'){
                                                button_type = 'kWh';
                                            }
                                            else if(prop.unit.toLowerCase() == 'w'){
                                                button_type = 'Watt';
                                            }
                                            else if(prop.unit.toLowerCase().startsWith('degree') ){
                                                button_type = 'Temperature';
                                            }
                                            else if(prop.unit.toLowerCase().startsWith('µg/m') || prop.unit.toLowerCase() == 'ppm'){
                                                button_type = 'Air';
                                            }
                                            else if(prop.unit.toLowerCase() == 'lx' || prop.unit.toLowerCase() == 'lux'){
                                                button_type = 'Lux'; //buttons_data['Lux'].push( logs[l] );
                                            }
                                            // Percentage
                                            else if(prop.unit.toLowerCase().startsWith('percent')){
                                                if(prop.title.toLowerCase().startsWith('battery')){
                                                    button_type = 'Battery';
                                                
                                                }
                                                else if(prop.title.toLowerCase().indexOf('humidity') != -1){
                                                    button_type = 'Humidity';
                                                }
                                            }
                                            //console.log("button_type: ", button_type);
                                            
                                            if(button_type != null){
                                                if(typeof thing_title != 'undefined' && typeof prop.title != 'undefined'){
                                                    //console.log("adding to quick filter buttons data");
                                                    var push_me = logs[l];
                                                    push_me['thing_title'] = thing_title;
                                                    push_me['property_title'] = prop.title;
                                                    buttons_data[button_type].push( push_me );
                                                }
                                                else{
                                                    // In theory some very old addons used "name" instead of title... they are skipped here.
                                                    if(this.debug){
                                                        console.warn("weird, could not add log to quick list. Title attribute of thing or property missing? Ancient addon?");
                                                    }
                                                }
                                            }
                                            
                                            
                                            
                                        }
                                        
                                        
                                    }
                                
                                    
                                
                                }
                            }
                    
                        }
                    
                    }
                    catch(e){
                        console.error("Error looping over logs while making quick filter buttons: ", e);
                    }
                
                } // end of looping over logs
                if(this.debug){
                    console.log("quick buttons_data: ", buttons_data);
                }
                
                // Find out if it's useful to show buttons
                const buttons_keys = Object.keys(buttons_data);
                var buttons_with_multiple_logs_count = 0;
                for(let b = 0; b < buttons_keys.length; b++){
                    if( buttons_data[buttons_keys[b]].length > 1 ){
                        buttons_with_multiple_logs_count++;
                    }
                }
                if(this.debug){
                    console.log("buttons_with_multiple_logs_count: ", buttons_with_multiple_logs_count);
                }
                
            
                // Clear the quick buttons container
                quick_log_filter_container.innerHTML = "";
                
                // Actually add the buttons
                if(buttons_with_multiple_logs_count > 1){
                    for(let b = 0; b < buttons_keys.length; b++){
                        
                        if( buttons_data[buttons_keys[b]].length > 0 ){
                            var button_el = document.createElement('button');
                            button_el.classList.add('candle-theme-quick-log-filter-button');
                            button_el.classList.add('text-button');
                            button_el.innerText = buttons_keys[b];
                            button_el.onclick = (event) => {
                                if(this.debug){
                                    console.log("quick log button clicked. data: ", b, buttons_data[buttons_keys[b]]);
                                }
                                var logs_to_show = [];
                                for(let d = 0; d < buttons_data[buttons_keys[b]].length; d++){
                                    if(this.debug){
                                        console.log("d: ", d, buttons_data[buttons_keys[b]][d]);
                                    }
                                    
                                    //var log_name = buttons_data[buttons_keys[b]][d]['thing_title'] + "-" + buttons_data[buttons_keys[b]][d]['property_title'];
                                    //log_name = log_name.replace(/\s/g , "-");
                                    //logs_to_show.push(log_name);
                                    logs_to_show.push({'thing': buttons_data[buttons_keys[b]][d]['thing'],'property':buttons_data[buttons_keys[b]][d]['property']});
                                }
                                this.filter_these_logs(logs_to_show);
                            
                            };
                            quick_log_filter_container.appendChild(button_el);
                            //console.log("should be appended");
                        }
                        
                    }
                    /*
                    setTimeout(() => {
                        if(document.getElementById('candle-theme-quick-log-filter-container') != null){
                            document.getElementById('candle-theme-quick-log-filter-container').style.display = 'block';
                        }
                    }, 1000);
                    */
                    
                    
                }
                
                
            
            }
            
        }catch(e){
            console.error("theme: error in create_quick_log_filter_buttons: ", e);
        }
        
		
        
    }
    




    // helper function to guarantee there is always a device name. If not provided it will be taken from the URL
    get_device_id_from_url(device_id){
        //console.log("checking device_id: " + device_id);
        //console.log(typeof device_id);
        
        if(typeof device_id == 'undefined' || device_id == null){
            
            const { pathname } = window.location;
            
            if(pathname.indexOf('/things/') == -1){
                //console.log("check_properties was called on url without /things/, stopping");
                return;
            }
            const paths = pathname.split("/").filter(entry => entry !== "");
            device_id = paths[paths.length - 1];
            //console.log('missing device_id, got it from url: ', device_id);
        }
        return device_id;
    }




    // Fixes things detail pages, by showing unknown properties with ...
    // This can be called multiple times when at a page, for example if a property with a known value changes to unknown, this can be reflected.
    checkProperties(device_id, on_new_page){
        /*
        if(Date.now < this.last_check_properties + 100){
            // not enough time has passed.
            //console.log("Ignoring request to checkProperties since the last request was "  + (Date.now - this.last_check_properties) + " millisecond ago.");
            if(this.check_properties_scheduled == false){
                // But no extra check was scheduled either. Doing that now.
                //console.log("scheduling another properties upgrade for a bit later");
                this.check_properties_scheduled = true;
                 window.setTimeout(() => { 
                     this.checkProperties();
                 },101);
            }
        }
        */
        
        
        if(window.location.pathname == '/things'){
            //console.log("check_properties was called on /things, stopping");
            return;
        }
        if(window.location.pathname.startsWith('/things')){
            if(this.debug){
                console.log("Theme: Error, check_properties was called on page outside of /things/*, stopping");
            }
            return;
        }
        
        if(typeof device_id == 'undefined'){
            device_id = this.get_device_id_from_url(device_id);
            //console.log("checking device properties for: " + device_id );
        }
        
        if(typeof device_id == 'undefined'){
            console.warn("Theme: checkProperties: undefined device id, aborting.");
            return;
        }
        
        if(on_new_page){
            //console.log("check_properties: on_new_page was true. Attaching listeners.");
        }
        
        //console.log("check_properties: looping over device: " + device_id);
        API.getThing(device_id).then((thing) => {
            //console.log("check_properties: single thing: ", thing );
            
            for (const property_name in thing.properties) {
                if (thing.properties.hasOwnProperty(property_name)) {
                    //console.log("_");
                    //console.log(property_name + " -> ", thing.properties[property_name]);
                    
                    var readOnly = false;
                    if(typeof thing.properties[property_name].readOnly != 'undefined'){
                        if(thing.properties[property_name].readOnly == true){
                            readOnly = true;
                        }
                    }
                    //console.log("readOnly: " + readOnly);
                    
                    try{
                        /*
                        API.getThing(device_id + '/' + property_name).then((prop) => {
                            //console.log("prop1", prop);
                        });
                        */
                        
                        API.getJson('/things/' + device_id + '/properties/' + property_name)
                        .then((prop2) => {
                            this.last_mutation_activation_time = Date.now();
                            //console.log("checkProperties: API property result for :" + property_name + ": ", prop2);
                            
                            //const read_only = readOnly;
                            
                            //console.log(typeof prop2);
                            //console.log("count: ", Object.keys(prop2).length );
                            
                            const capitalised_property_name = property_name.charAt(0).toUpperCase() + property_name.slice(1);
                            
                            try{
                                if(on_new_page){
                                    //console.log("check_properties: on_new_page was true. Attaching listeners.");
                                    var element_to_observe = document.querySelector('[id$="' + property_name + '"]');
                                    if(element_to_observe != null){
                                        const shadow_to_observe = element_to_observe.shadowRoot;
                                        this.shadow_observer.observe( shadow_to_observe, {childList: true, subtree:true} ); // attributes: true, 
                                    }
                                    else{
                                        //console.log("property to observe didn't exist yet: " + property_name);
                                    }
                                }
                               
                            }
                            catch(e){
                                //console.log("error adding value observer: ", e);
                            }
                            
                            
                            
                            
                            if(typeof prop2 == 'object'){
                                // gateway 1.0.0
                                if(Object.keys(prop2).length === 0){
                                    //console.log(property_name + " was Undefined");
                                
                                    this.modify_property_ui(property_name, false);
                                }
                                else if(prop2[property_name] == null){
                                    //console.log(property_name + " WAS NULL");
                                    this.modify_property_ui(property_name, false);
                                }
                            }
                            else{
                                if(prop2 == null){
                                    //console.log(property_name + " WAS NULL: ", prop2);
                                    this.modify_property_ui(property_name, false);
                                }
                            }
                            
                            /*
                            else{
                                // good property. Fix if need be?
                                
                                //var bad_element = document.querySelector('[data-name="' + property_name + '"]');
                                var good_element = document.querySelector('[id$="' + property_name + '"]');
                                //console.log(bad_element);
                                if(good_element == null){
                                    //console.log("trying: alt: " + capitalised_property_name);
                                    good_element = document.querySelector('[data-name="' + capitalised_property_name + '"]');
                                }
                                
                                if(good_element == null){
                                    //console.log("ERROR good element still not spotted..");
                                    //continue;
                                }
                                else{
                                    //console.log("hello there: ", good_element);
                                    
                                    const shadow = good_element.shadowRoot;
                                    //console.log('shadow: ', shadow);
                                }
                            }*/
                        })
                        .catch((err) => {
                            //console.log("API error: ", err);
                            this.modify_property_ui(property_name, false); //
                        });
                    }
                    catch(e){
                        //console.log("Error: ", e);
                    }
                    
                    
                    /*
                    if(typeof thing.properties[property_name].value != 'undefined'){
                        //console.log(thing.properties[property_name].value);
                    }
                    else{
                        //console.log("no value!");
                    }
                    */
                }
            }
            
            
            
        });
        
    }

    // helper function for checkProperties that set the target to ...
    modify_property_ui(property_name, desire=false){
        //console.log("in modify_property_ui. property_name: " + property_name);
        //var bad_element = document.querySelector('[data-name="' + property_name + '"]');
        var bad_element = document.querySelector('[id$="' + property_name + '"]');
        //console.log(bad_element);
        /*
        if(bad_element == null){
            //console.log("trying: alt: " + capitalised_property_name);
            bad_element = document.querySelector('[data-name="' + capitalised_property_name + '"]');
        }
        */
        
        if(bad_element == null){
            //console.log("ERROR bad element still not spotted..");
            //continue;
        }
        else{
            //console.log("we got em: ", bad_element);
            
            const shadow = bad_element.shadowRoot;
            //console.log('shadow: ', shadow);
            
            const value_element = shadow.querySelector('[id^="value-"]');
            if(value_element != null){
                value_element.innerText = "...";
            }
            else{
                const label_element = shadow.querySelector('[id^="label-"]');
                if(label_element != null){
                    label_element.innerText = "...";
                }
            }
            
        }
    }



    // reacts to changes to things overview and detail pages
    thingsMutationCallback(mutations) {
        //console.log("new mutations:", mutations.length);
        
        const mutationRecords = this.observer.takeRecords()
        //console.log("mutation records: ", mutationRecords);
        var should_upgrade = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                should_upgrade = true
                //this.addParts();
                //this.addThermostatButtons();
            }
        }
      //console.log("mutations, should_upgrade = " + should_upgrade);
      if(should_upgrade && window.location.pathname.startsWith('/things')){
          //console.log("mutation: nodes added on path starting with /things");
          //console.log("mutation: should add parts and thermostat buttons");
          this.addParts();
          
      }
      if(window.location.pathname.startsWith('/things/')){
          //console.log("mutation: should add parts and thermostat buttons");
          //this.checkProperties(null,true);
          if(should_upgrade){
              this.addThermostatButtons();
          }
      }
      
      try{
          if(window.location.pathname != this.previous_document_location){
              if(this.previous_document_location == '/logs'){
                  //console.log("DOES THE MUTATION LISTENER WORK ON LOGS? APPARENTLY SO");
                  this.update_logs_list();
              }
              this.previous_document_location = window.location.pathname;
              this.on_new_page();
              
              
          }
          
      }
      catch(e){}

    }
    
    // Mutation callback. Upgrades the pop-up messages that are normally related to pairing messages.
    messageAreaCallback(mutations) {        
        
        function upgrade(){
            //setTimeout(function(){ 
            window.setTimeout(() => { 
                const message_array = document.getElementById('message-area').innerText.split(":", 3);
                //console.log(message_array);
                if(message_array.length > 2){
                    var upgraded_message = '<span class="candle-theme-message-addon">' + message_array[0] + '</span>';
                    upgraded_message += '<span class="candle-theme-message-device">' + message_array[1] + '</span>';
                    upgraded_message += '<span class="candle-theme-message-message">' + message_array[2] + '</span>';
                    //console.log(upgraded_message);
                    document.getElementById('message-area').innerHTML = upgraded_message;
                }
            
            }, 10);
        }
        
        for (const mutation of mutations) {
            //console.log(mutation);
            if(mutation.removedNodes !== undefined){
                if (mutation.removedNodes.length == 1){
                    //console.log("removed 1 node");
                    upgrade();
                }
            }
            //if(mutation.hasOwnProperty(addedNodes)){
            if(mutation.addedNodes !== undefined){
                if (mutation.addedNodes.length == 1){
                    //console.log("added one node");
                    upgrade();
                }
            }
          
          }
    }
    
    

    updateInputValue(id, adjustment) {
      const target = document.getElementById(id);
      const value = Number(target.value);
      target.value = value + adjustment;
      target.dispatchEvent(new Event('change'));
    }
    

    addParts() {
      const items = [
        '#groups .thing > *:not(a):not(span):not(.component)',
        '#things:not(.single-thing) > .thing > *:not(a):not(span):not(.component)',
        '#things:not(.single-thing) > .thing > *:not(div):not(.component)',
        '#things.single-thing > .thing > *:not(div)',
        '#things.single-thing > .thing > div.thing-detail-container > *:not(.component)',
      ].join(', ');
      const listItems = document.querySelectorAll(items);

      for (const item of listItems) {
        if (item.shadowRoot){
          item.classList.add('component');
          this.updateStyle(item);
        }
      }
      //console.log("listItems.length in addParts: " + listItems.length);
      if(listItems.length){
          //console.log("adding mutation indicator class");
          document.getElementById('things-view').classList.add("candle-theme-things-mutated");
      }
    }

    
    
	// Creates list of checkboxes in the filter side bar
	addLogSelector() {
        if(this.debug){
            console.log("theme: in addLogSelector (checkboxes list in filter sidebar)");
        }
        const logs_view = document.getElementById("logs-view");
		
		const log_list_container = document.getElementById("candle-theme-log-list-container");
        
        if(typeof this.api_logs == 'undefined'){
            if(this.debug){
                console.warn("candle theme: addLogSelector: this.api_logs was still null. Did window API to list logs fail?");
            }
        }
        else{
            if(this.debug){
                console.log("candle theme: addLogSelector: this.api_logs: ", this.api_logs);
            }
            if(this.api_logs.length == 0){
                //console.warn("candle theme: addLogSelector: this.api_logs was still an empty array. Could simply be that the user has no logs.");
                log_list_container.innerHTML = '<p style="font-size:1.6rem;padding:1rem">Once you have created some logs you can filter them here.</p>';
            }
            else{
                
                for (var f=0;f<this.api_logs.length;f++){
                    const log_name = this.ids_to_log_name(this.api_logs[f]);
                    if(log_name != null){
                        //console.log("log name from ids_to_log_name: ", log_name);
                        this.api_logs[f]['html_log_name'] = log_name;
                    }
                    else{
                        if(this.debug){
                            console.warn("generated html_log_name was null. Broken log?");
                        }
                    }

                }
                
                // Sort the logs data
                function compare(a,b) {
                    try{
                        if(typeof a.html_log_name != 'undefined' && typeof b.html_log_name != 'undefined'){
                            const a_title = a.html_log_name.toLowerCase();
                            const b_title = b.html_log_name.toLowerCase();
                            if (a_title < b_title){
                                return -1;
                            }
                            if (a_title > b_title){
                                return 1;
                            }
                        }
                        return 0;
                    }catch(e){
                        console.warn("log item sorting error: ", e);
                        return 0;
                    }
                }
                this.api_logs.sort(compare);
                //console.log("this.api_logs sorted: ", this.api_logs);
                
                log_list_container.innerHTML = "";
                
                // Create checkbox list
                let ul = document.createElement('ul');
                ul.setAttribute("id", "candle-theme-log-list-ul");
                
                for (var i=0;i<this.api_logs.length;i++){
                    
                    if(typeof this.api_logs[i]['html_log_name'] != 'undefined'){
                        const dashed_log_name = this.api_logs[i]['html_log_name'].replace(/\s/g , "-");
                    
                        let li = document.createElement('li');
                        
                        var input = document.createElement("input");
                            //input.type = "checkbox";
                            input.setAttribute('type', 'checkbox');
                            input.setAttribute('name', dashed_log_name);
                            input.setAttribute('id', dashed_log_name);
                            input.setAttribute('data-thing', this.api_logs[i].thing);
                            input.setAttribute('data-property', this.api_logs[i].property);

                        var label = document.createElement("label");
                            label.setAttribute("for",dashed_log_name);
		
            			var span = document.createElement("span");
            				span.innerHTML = this.api_logs[i]['html_log_name'];

                        label.appendChild(input);
            			label.appendChild(span);
                        li.appendChild(label);

            	  	    li.onclick = (event) => {
            				if(this.debug){
                                console.log("filter item clicked");
                            }
                            this.filterLogs();
            	  	  	}

                        ul.appendChild(li);
                    }
                    
                }
                
                log_list_container.appendChild(ul);	
		
		
        		let filter_buttons = document.createElement('div');
        		filter_buttons.setAttribute("id", "candle-theme-log-list-buttons");
		
        
        		// Overlay button
        		let overlay_button = document.createElement('button');
        		overlay_button.setAttribute("id", "candle-theme-logs-overlay-button");
                overlay_button.setAttribute("class", "candle-theme-logs-small-button");
        		overlay_button.textContent = "Overlay";
        		filter_buttons.appendChild(overlay_button)
        
                // Clear button
        		let clear_button = document.createElement('button');
        		clear_button.setAttribute("id", "candle-theme-logs-clear-button");
                clear_button.setAttribute("class", "candle-theme-logs-small-button");
        		clear_button.textContent = "Clear";
                clear_button.style.display = 'none';
        		filter_buttons.appendChild(clear_button)
        
                // Add collection button
        		let collection_button = document.createElement('button');
        		collection_button.setAttribute("id", "candle-theme-logs-add-collection-button");
                collection_button.setAttribute("class", "candle-theme-logs-small-button");
        		collection_button.textContent = "Add collection";
                collection_button.style.display = 'none';
        		filter_buttons.appendChild(collection_button)
        
        
        		log_list_container.appendChild(filter_buttons)
		
        
        		document.getElementById("candle-theme-logs-clear-button").onclick = (event) => {
          		    if(this.debug){
                        console.log("Clear logs filter button clicked");
                    }
                    this.addLogSelector(); // TODO: could this attach additional listeners?
                    this.filterLogs();
        		}
        
        
        		document.getElementById("candle-theme-logs-overlay-button").onclick = (event) => {
          		    //console.log("Overlay button clicked");
			
        	        if (logs_view.classList.contains('candle-theme-logs-overlay')) {
        				logs_view.classList.remove('candle-theme-logs-overlay');
        		  	}
        			else{
        				logs_view.classList.add('candle-theme-logs-overlay');
        			}
        		}

        
                if (localStorage.getItem("candle_theme_log_collections") !== null) { // TODO: isn't this deprecated? Isn't this stored on the controller now? I guess it saves some time. But it could get out of sync.
                    console.warn("add_log_selector: candle_theme_log_collections was still in local storage?");
                    this.showLogCollections();
                }
        
        		document.getElementById("candle-theme-logs-add-collection-button").onclick = (event) => {//.onclick = function(event){
                    this.addLogCollection();
        		}
                
            }
        }
        //this.filterLogs(); // resets the filtered logs to no filter
	}

    // Goes over all the ticked checkboxes, and based on that shows or hides logs
    filterLogs(){
        if(this.debug){
            console.log("in filterLogs");
        }
		// get list of all log names
		const all_log_name_elements = document.querySelectorAll('#logs-view .logs-log-name');
        var all_log_names = [];
        for (const log_name_element of all_log_name_elements) {
            if(this.debug){
                //console.log("log name element: ", log_name_element);
            }
            
            var log_name_raw = null;
            const span1 = log_name_element.getElementsByTagName('span')[0];
            const span2 = log_name_element.getElementsByTagName('span')[1];
            
            if(span1 != null && span2 != null){
                log_name_raw = span1.innerText + " " + span2.innerText;
            }
            else{
                log_name_raw = log_name_element.innerText;
            }
            if(log_name_raw != null && log_name_raw != ""){
                all_log_names.push(log_name_raw.replace(/\s+/g, '-'));
            }
        }
        
        if(this.debug){
            console.log("\nfilterLogs: all_log_names: ", all_log_names);
        }
		
        
        
		// get list of selected log names
        const selected_logs = document.querySelectorAll(' #logs-view #candle-theme-log-list-ul input:checked');
        //console.log("selected_logs: ", selected_logs);
        var selected_log_names = [];
        for (const selected_log of selected_logs) {
            selected_log_names.push(selected_log.name);
			//console.log(selected_log);
        }
        if(this.debug){
            console.log("selected log filter item names: ", selected_log_names);
        }
		
        if(selected_log_names.length > 0){
            document.getElementById('candle-theme-logs-clear-button').style.display = 'block';
            if(selected_log_names.length > 1){
                document.getElementById('candle-theme-logs-add-collection-button').style.display = 'block';
            }
            else{
                document.getElementById('candle-theme-logs-add-collection-button').style.display = 'none';
            }
        }
        else{
            document.getElementById('candle-theme-logs-clear-button').style.display = 'none';
        }
        
		const all_logs = document.querySelectorAll(' #logs-view .logs-log-container');
		//console.log(all_logs);
        
		var log_counter = 0;
		for (const log_container of all_logs) {
            //console.log("comparing:", log_container);
			//console.log("comparing to:", all_log_names[log_counter]);
			// If the current corresponding name is in the selected arrays name
			if( selected_log_names.indexOf(all_log_names[log_counter]) > -1 || selected_log_names.length == 0 ){
				//console.log("do not hide " + all_log_names[log_counter]);
				//log_container.style.visibility = 'visible';
                if(this.debug){
                    //console.log("not hiding log: ", all_log_names[log_counter], ' because it is in: ', selected_log_names);
                }
				log_container.style.display = 'block';
			}
			else{
				//console.log("hiding log container: " + all_log_names[log_counter]);
				//console.log(log_container);
				//log_container.style.visibility = 'hidden';
                if(this.debug){
                    //console.log("hiding log: ", all_log_names[log_counter], ' because it is not in: ', selected_log_names);
                }
				log_container.style.display = 'none';
			}
			log_counter++;
		}
    }

    
    // Not currently used?
    // Transforms a thing-property combo into a single string name (concatenated titles)
    ids_to_log_name(combo){
        if(this.debug){
            console.log("in log_name_to_ids with combo: ", combo);
        }
        
        if(typeof this.things == 'undefined'){
            console.warn("ids_to_log_name: too early, this.things was still undefined");
            return null;
        }
        
        for (var t=0;t<this.things.length;t++){
            if(this.things[t].href.endsWith('/' + combo.thing)){
                //const thing_id = this.things[t].href.split('/').pop();
                //console.log("found a thing id that is in the logs too: ", thing_id);
                if(this.things[t].title != 'undefined'){
                    if(typeof this.things[t]['properties'][combo.property] != 'undefined'){
                        if(typeof this.things[t]['properties'][combo.property]['title'] != 'undefined'){
                            return this.things[t].title + ' ' + this.things[t]['properties'][combo.property]['title'];
                        }
                        else{
                            console.warn("candle theme: ids_to_log_name: title attribute not found in property: ", combo, this.things[t]['properties'][combo.property] );
                        }
                    }
                    else{
                        console.warn("candle theme: ids_to_log_name: property not found in thing: ", combo, this.things[t]);
                    }
                }
            }
        }
        return null;
    }


    log_name_to_ids(old_name){
        if(this.debug){
            console.log("in log_name_to_ids with old_name: ", old_name);
        }
        
        old_name = old_name.replace(/\s/g , "-"); // make sure the old name uses dashes instead of space. The are compared with dashes because the old names were stored that way.
        
        if(typeof this.api_logs == 'undefined'){
            console.warn("log_name_to_ids: too early, this.api_logs was still undefined");
            return null;
        }
        if(typeof this.things == 'undefined'){
            console.warn("log_name_to_ids: too early, this.things was still undefined");
            return null;
        }
        //console.log("log_name_to_ids. api_logs and things data is available: ", this.api_logs, this.things);
        if(this.debug){
            console.log("log_name_to_ids: OK, api_logs and things data is available");
        }
        
        var found_thing_title = null;
        for (var i=0;i<this.api_logs.length;i++){
            
            for (var t=0;t<this.things.length;t++){
                if(this.things[t].href.endsWith('/' + this.api_logs[i].thing)){
                    const thing_id = this.things[t].href.split('/').pop();
                    //console.log("found a thing id that is in the logs too: ", thing_id);
                    if(this.things[t].title != 'undefined'){
                        //console.log("found a thing title that is in the log: ", this.things[t].title);
                        
                        const dashed_title = this.things[t].title.replace(/\s/g , "-"); //.replace(/-/g, ' ');
                        //console.log("--dashed_title: ", dashed_title);
                        if(old_name.startsWith(dashed_title)){
                            if(this.debug){
                                console.log("Found it. The old name started with the title of this thing: ", dashed_title);
                            }
                            found_thing_title = this.things[t].title;
                            if(typeof this.things[t]['properties'] != 'undefined'){
                                const property_keys = Object.keys(this.things[t]['properties']);
                                for (var p=0;p<property_keys.length;p++){
                                    if(typeof this.things[t]['properties'][ property_keys[p] ]['title'] != 'undefined'){
                                        
                                        const dashed_property_title = this.things[t]['properties'][ property_keys[p] ]['title'].replace(/\s/g , "-");
                                        
                                        if(dashed_title + '-' + dashed_property_title == old_name){
                                            if(this.debug){
                                                console.log("Found matching property id: ", property_keys[p]);
                                            }
                                            return {'thing':thing_id,'property': property_keys[p]};
                                        }
                                    }
                                }
                            }
                        }
                        
                    }
                    else{
                        console.error("thing has no title? maybe an ancient addon? Skipping all the same..");
                    }
                    
                }
            
            }
            /*
            if(this.api_logs[i].thing == device_id){
                //console.log("adding property: ", this.api_logs[i].property);
                properties_to_show.push( '/logs/things/' + device_id + '/properties/' + this.api_logs[i].property );
            }*/
        }
        
        
        return null;
    }

    
    // Create a new collection of logs and save it to the backend
    addLogCollection(){
        //let self = this;
        //var log_collections = {};
        //if (localStorage.getItem("candle_theme_log_collections") !== null) {
        //    log_collections = JSON.parse( localStorage.getItem("candle_theme_log_collections") );
        //}
        
        const selected_logs = document.querySelectorAll(' #logs-view #candle-theme-log-list-ul input:checked');
        var selected_log_names = [];
        for (const selected_log of selected_logs) {
            if(this.debug){
                console.log("addLogCollection. Selected log: ", selected_log);
            }
            
            if(typeof selected_log.dataset.thing != 'undefined' && typeof selected_log.dataset.property != 'undefined'){
                if(this.debug){
                    console.log("GREAT, getting list of selected logs the modern way: ", selected_log.dataset.thing, selected_log.dataset.property);
                }
                selected_log_names.push({'thing':selected_log.dataset.thing,'property':selected_log.dataset.property});
            }
            else{
                console.error("getting log combo the old fashioned way");
                const ids_dict = log_name_to_ids(selected_log.name);
                if(ids_dict != null){
                    selected_log_names.push(ids_dict);
                }
            }
            
        }
        
        
        //localStorage.setItem('keyboardEnabled', false); // TODO: what does this do again?
        
        if( selected_logs.length > 1){
            
            const collection_popup_container = document.getElementById('extension-candle-theme-collection-input-popup-container');
            if(collection_popup_container!= null){
                collection_popup_container.parentNode.removeChild(collection_popup_container);
            }
            
            if(document.getElementById('extension-candle-theme-collection-input-popup-container') == null){
                if(this.debug){
                    console.log("creating and appending collection name input popup html");
                }
                
                var collection_popup_el = document.createElement("div");
                collection_popup_el.id = 'extension-candle-theme-collection-input-popup-container';
                
                var popup_html =  '<div id="extension-candle-theme-collection-input-popup">';
                popup_html += '<div><h2>Please provide a name for the collection</h2>';
                popup_html += '<input id="extension-candle-theme-collection-name-input" type="text" placeholder="Collection name">';
                popup_html += '<button id="extension-candle-theme-collection-name-cancel-button" class="text-button">Cancel</button>';
                popup_html += '<button id="extension-candle-theme-collection-name-save-button" class="text-button">Save</button>';
                popup_html += '</div></div>';
                collection_popup_el.innerHTML = popup_html;
                
                document.body.appendChild(collection_popup_el);
                
                document.getElementById('extension-candle-theme-collection-name-save-button').onclick = (event) => {
                    if(this.debug){
                        console.log("save collection button clicked");
                    }
                        
                    const collection_name = document.getElementById('extension-candle-theme-collection-name-input').value;
                
                    if(collection_name != "" && collection_name != null){
                        //console.log("collection_name = " + collection_name);
                        //console.log("selected: ", selected_log_names);
                        /*
                        if(typeof this.log_collections == 'string'){
                            //console.log("log collections was string? fixing.");
                            this.log_collections = JSON.parse(this.log_collections);
                        }
                        */
                        this.log_collections[collection_name] = selected_log_names; //.push({'name':collection_name,'logs':selected_log_names});
        
                        //localStorage.setItem("candle_theme_log_collections", JSON.stringify(this.log_collections));
                
                        //console.log('going to save: ', this.log_collections);
                    
                  		// Save collections
                        window.API.postJson(
                          `/extensions/${this.id}/api/ajax`,
                            {'action':'save_collections','collections':this.log_collections}

                        ).then((body) => {
                			//console.log("save_collections API result:");
                			//console.log(body);
                            const collection_popup_container = document.getElementById('extension-candle-theme-collection-input-popup-container');
                            if(collection_popup_container != null){
                                collection_popup_container.parentNode.removeChild(collection_popup_container);
                            }
                            this.showLogCollections();
            
                        }).catch((e) => {
                  			console.log("Error saving collections after adding a collection: ", e);
                        });	
                
                    }
                
                };
                
                
                document.getElementById('extension-candle-theme-collection-name-cancel-button').onclick = (event) => {
                    const collection_popup_container = document.getElementById('extension-candle-theme-collection-input-popup-container');
                    if(collection_popup_container != null){
                        collection_popup_container.parentNode.removeChild(collection_popup_container);
                    }
                
                };
            }
            
        }
        else{
            console.log("select at least two logs");
        }
		
    }


    // Upgrades user data to more future proof version of log collections
    upgrade_collections_data(old_collections){
        if(this.debug){
            console.log("in upgrade_old_collections. old_collections: ", old_collections);
        }
        var new_collections_data = {};
        //if(this.api_logs != null){ // is this even a possiblity?
        //console.log("attempting upgrade of old collections data");
        
        const keys = Object.keys(old_collections);
        
        for(let k= 0; k < keys.length; k++){
        //for (const old_collection of old_collection) {
            //console.log("\n-----", k, keys[k]);
            const old_collection = old_collections[ keys[k] ];
            //console.log("old_collection: ", old_collection);
            var new_collection_array = [];
            for(let oc = 0; oc < old_collection.length; oc++){
                //console.log("upgrade_collections_data: upgrading string: ", old_collection[oc]);
                const collection_combo = this.log_name_to_ids( old_collection[oc] );
                //console.log("improved combo: ", collection_combo);
                if(collection_combo != null){
                    //console.log("upgraded collection combo: ", collection_combo);
                    new_collection_array.push(collection_combo);
                }
                else{
                    console.warn("upgrade collections: not adding improved combo because log_name_to_ids returned null for: ", old_collections[oc]);
                }
            }
            if(new_collection_array.length > 0){
                //console.log("new collection array is not empty, good: ", new_collection_array);
                new_collections_data[ keys[k] ] = new_collection_array;
            }
            else{
                console.warn("upgrade_collections_data: entire upgraded array was empty??");
            }
            
        }
        

        console.log("UPGRADED new_collections_data: ", new_collections_data, "\n");
        
        this.log_collections = new_collections_data;
        // Also save the upgraded collections data
        
  		// Save collections after upgrade. In theory this should only happen once.
        window.API.postJson(
          `/extensions/${this.id}/api/ajax`,
            {'action':'save_collections','collections':this.log_collections}

        ).then((body) => {
			console.log("Save upgraded collections API result: ", body);
            //localStorage.setItem("candle_theme_log_collections", JSON.stringify(this.log_collections));

        }).catch((e) => {
  			console.log("Error saving upgraded log collections: ", e);
        });
    }

    // Creates collection buttons
    showLogCollections(){
        if(this.debug){
            console.log("in showLogCollections");
        }
        
  		// Save collections
        window.API.postJson(
          `/extensions/${this.id}/api/ajax`,
            {'action':'get_collections'}

        ).then((body) => {
			if(this.debug){
                console.log("get_collections API result:");
			    console.log(body);
            }
            if(typeof body.collections != 'undefined'){
                if(this.debug){
                    console.log("theme: logs: theme api: get_collections response: body.collections existed: ", body.collections);
                }
                
                
                const keys = Object.keys(body.collections);
        
                if(keys.length > 0){
                    //for(let k= 0; k < keys.length; k++){
                    // get first dict item's first array item. If it's a string, then it's old fashioned collections data.
                    if(typeof body.collections[ keys[0] ][0] == "string" ){
                        console.warn("Candle theme: OLD FASHIONED COLLECTIONS DATA SPOTTED. WILL ATTEMPT UPGRADE.");
                        this.upgrade_collections_data(body.collections);
                    }
                    else{
                        //console.log("collections data already upgraded");
                        this.log_collections = body.collections;
                    }
                }
                
                //localStorage.setItem("candle_theme_log_collections", JSON.stringify(this.log_collections));
            }
        }).catch((e) => {
  			//console.log("Error getting log collections data: ", e);
            
            if (localStorage.getItem("candle_theme_log_collections") !== null) {
                //console.log("localStorage had log collection data:", localStorage.getItem("candle_theme_log_collections") );
                this.log_collections = JSON.parse( localStorage.getItem("candle_theme_log_collections") );
            }
            else{
                //console.log("browser local storage had no collections backup");
                return;
            }
        }).then(() => {
            //console.log('Do this, no matter what happened before. log_collections type: ', typeof this.log_collections);
            //console.log(this.log_collections);
            
            const collection_names = Object.keys(this.log_collections);
            //console.log("collection_names: ", collection_names);
            document.getElementById('candle-theme-log-collections-container').innerHTML = "";
        
            collection_names.forEach((collection_name, index) => {
                //console.log(`${collection_name}: ${this.log_collections[collection_name]}`);
            
                if(this.debug){
                    console.log("creating button for collection: ", collection_name, index);
                }
        		let new_collection_button = document.createElement('button');
        		new_collection_button.setAttribute("class", "candle-theme-logs-collection-button candle-theme-logs-small-button");
        		new_collection_button.textContent = collection_name;
            
                // on a click, set the checkboxes to the correct position
                new_collection_button.onclick = (event) => { //function(element_name){
                    //console.log("collection button clicked", event.target.innerText);
                    //console.log(this);
                    if(this.debug){
                        console.log("log collection button clicked. All log_collections: ", this.log_collections);
                        console.log("- will show this log_collection: ", this.log_collections[event.target.innerText]); // TODO: xxxx this will fail with new approach? Or is this the log collection name?
                    }
                    
                    //console.log("log_collection: ", log_collections[event.target.innerText]);
                    let should_check = this.log_collections[event.target.innerText];
                    if(this.debug){
                        console.log("collection button clicked. should_check these checkboxes: ", should_check);
                    }
                    this.filter_these_logs(should_check);
                    
                    // remove sidebar when collection button is clicked
                    //this.hideLogMenu();
                    //document.getElementById('candle-theme-log-collections-container').innerHTML = "";
                    document.getElementById('candle-theme-log-filter-container').classList.add('candle-theme-log-filter-container-hidden');
                
                };
            
            
        		let new_collection_delete_button = document.createElement('button');
        		new_collection_delete_button.setAttribute("class", "candle-theme-logs-collection-delete-button candle-theme-logs-small-button");
        		//new_collection_delete_button.textContent = "✖";
                new_collection_delete_button.innerHTML = '&#10006;';
                new_collection_delete_button.onclick = (event) => {
                    //console.log(collection_name);
                    //console.log(event);
                    if(confirm('Are you sure you want to remove the "' + collection_name + '" collection?')){
                        let parent = event.target.parentElement;
                        parent.parentNode.removeChild(parent);
                
                        delete this.log_collections[collection_name];
                        
                        
                  		// Save collections after a collection was deleted
                        window.API.postJson(
                          `/extensions/${this.id}/api/ajax`,
                            {'action':'save_collections','collections':this.log_collections}

                        ).then((body) => {
                			//console.log("Save collections API result: ", body);
                            localStorage.setItem("candle_theme_log_collections", JSON.stringify(this.log_collections));
            
                        }).catch((e) => {
                  			console.log("Error saving log collections after deleting a collection: ", e);
                        });	
                        
                    }
                
                };
            
            
                let new_collection_button_container = document.createElement('div');
                new_collection_button_container.setAttribute("class", "candle-theme-logs-collection-button-container");
            
                new_collection_button_container.appendChild(new_collection_button);
                new_collection_button_container.appendChild(new_collection_delete_button);
            
        		document.getElementById('candle-theme-log-collections-container').appendChild(new_collection_button_container);
            
            });
            
        });
    }



    // Toggles the correct checkboxes, and then calls filterLogs.
    filter_these_logs(should_check){ // ingests list of thing+property dictionaries
        if(this.debug){
            console.log("theme: should check these log filter checkboxes: ", should_check);
        }
        const log_checkboxes = document.querySelectorAll(' #logs-view #candle-theme-log-list-ul input');

        for (const checkbox of log_checkboxes) {
            if(this.debug){
                console.log("checkbox.name: ", checkbox.name);
            }
            
            if(typeof checkbox.dataset.thing != 'undefined' && typeof checkbox.dataset.property != 'undefined'){
                checkbox.checked = false;
                // Loop over all the thing-properties combo's that should be checked
                for( let cb = 0; cb < should_check.length; cb++){
            
                    if(typeof should_check[cb].thing != 'undefined' && typeof should_check[cb].property != 'undefined'){
                    //console.log("OK .thing exists in log_checkboxes"); // , log_checkboxes
                
                    //const0checkbox_name = checkbox.name
                    
                    //console.log("checkbox.name: ", checkbox.name);
                    
                    
                        //console.log("thing and property exist: ", checkbox.name);
                        //console.log("checkbox.dataset.thing: ", checkbox.dataset.thing);
                        //console.log("checkbox.dataset.property: ", checkbox.dataset.property);
                        if(should_check[cb].thing == checkbox.dataset.thing && should_check[cb].property == checkbox.dataset.property){
                            if(this.debug){
                                console.log("setting checkbox to true: ", checkbox.dataset.property);
                            }
                            checkbox.checked = true;
                        }
                        
                    }
                    else{
                        console.error("Error, should_check item does not have thing and/or property");
                        checkbox.checked = false;
                    }
                    /*
                    if(should_check.indexOf(checkbox.name) == -1){
                        console.log("should not check");
                        checkbox.checked = false;
                    }
                    else{
                        console.log("should check: " + checkbox.name);
                        checkbox.checked = true;
                    }*/
                }
            }
            else{
                console.error("Error in filter_these_logs: no thing and property dataset attribute in checkbox element");
            }
            
        }

        
        
        // finally, call filter logs with the new checkboxes settings
        this.filterLogs();
    }



    // This takes yet another approach, comparing the href in each log container with href's from the selected device.
    // Downside is that this doesn't also check the filter checkboxes.
    filter_logs_by_device(device_id){
        console.log("in filter logs by device. Device ID: " + device_id);
        //console.log(this.api_logs);
        
        var properties_to_show = [];
    
        for (var i=0;i<this.api_logs.length;i++){
            if(this.api_logs[i].thing == device_id){
                //console.log("adding property: ", this.api_logs[i].property);
                properties_to_show.push( '/logs/things/' + device_id + '/properties/' + this.api_logs[i].property );
            }
        }
        
        const log_elements = document.getElementsByClassName('logs-log-container');
        //console.log("log_elements: ", log_elements);
        
        if(log_elements == null){
            setTimeout(() => {
                this.filter_logs_by_device(device_id);
            }, 100);
            return;
        }
        if(log_elements.length < this.api_logs.length){
            //console.log('Logs are not ALL there yet');
            setTimeout(() => {
                this.filter_logs_by_device(device_id);
            }, 100);
            return;
        }
        //console.log("The logs are there!");
        //console.log("log_elements: ", log_elements);
        
		//const all_logs = document.querySelectorAll(' #logs-view .logs-log-container');
		//console.log(all_logs);
        
        //console.log("properties_to_show: ", properties_to_show);
        
		var log_counter = 0;
		for (const log_container of log_elements) {
            
            const href = log_container.getElementsByClassName('logs-log-info')[0].href;
            //console.log(href);
            
            var spotted = false;
            for (var j=0;j<properties_to_show.length;j++){
                if(href.endsWith(properties_to_show[j])){
                    //console.log("should be hidden");
                    spotted = true;
                }
            }
            if(!spotted){
                log_container.style.display = 'none';
            }
            
            if(properties_to_show.indexOf(href) == -1){

            }
            /*
            //console.log("comparing:", log_container);
			//console.log("comparing to:", all_log_names[log_counter]);
			// If the current corresponding name is in the selected arrays name
			if( selected_log_names.indexOf(all_log_names[log_counter]) > -1 || selected_log_names.length == 0 ){
				//console.log("do not hide " + all_log_names[log_counter]);
				//log_container.style.visibility = 'visible';
				
			}
			else{
				//console.log("hiding log container: " + all_log_names[log_counter]);
				//console.log(log_container);
				//log_container.style.visibility = 'hidden';
				log_container.style.display = 'none';
			}
			log_counter++;
            */
		}
        
        /*
        const log_links = .getElementsByClassName('logs-log-info');
        //console.log("log_links: ", log_links);
        for (var j=0;j<log_elements.length;j++){
            
        }
        */

        
        //console.log("properties_to_show:", properties_to_show);
        //this.filter_these_logs(properties_to_show);
    }
    



    hideLogMenu(){
        //console.log("in hideLogMenu");
		const list = document.getElementById('candle-theme-log-list-ul');
		const buttons = document.getElementById('candle-theme-log-list-buttons');
        
		list.parentNode.removeChild(list);
		buttons.parentNode.removeChild(buttons);
        //let collection_button_container = document.getElementById('candle-theme-log-collections-container');
        //collection_button_container.parentNode.removeChild(collection_button_container);
        document.getElementById('candle-theme-log-collections-container').innerHTML = "";
        //document.getElementById('logs-view').classList.remove('candle-theme-logs-overlay');
    }



    // Add 'part' attribute to elements in the shadow doms so that they may be targetted with CSS
    updateStyle(elem) {
      const shadow = elem.shadowRoot;
      const items = shadow.querySelectorAll('*');

      for (const item of items) {
        let part = item.getAttribute('id');
        if (part !== null) {
          if (part.indexOf('-') != -1) {
              //part = part.substr(0, part.indexOf('-'));
              part = part.substring(0, part.lastIndexOf('-'));
          }
          item.setAttribute('part', part);
        }
      }
      
      // if using the ID didn't add a part attribute, try again, but this time with class.
      for (const item of items) {
        let part = item.getAttribute('class');
        if (part !== null) {
          if(!item.hasAttribute("part")){
              if (part .indexOf(' ') != -1) {
    			  part = part.substr(0, part.indexOf(' '));
              }
              item.setAttribute('part', part);
          }
        }
      }
    }
    
    
    // TODO; add these buttons on the things overview page too?
    addThermostatButtons() {
      const thermostats = document.getElementsByTagName(
        'webthing-target-temperature-property'
      );

      for (const thermostat of thermostats) {
        if (!thermostat.classList.contains('extra-thermostat-buttons')) {
          thermostat.classList.add('extra-thermostat-buttons');

          const down = document.createElement('div');
          down.id = 'down';
					down.setAttribute("part", "down"); 
					down.innerHTML = '-';
          down.addEventListener('click', () => {
            this.updateInputValue(thermostat.id, -.5);
          });

          const up = document.createElement('div');
          up.id = 'up';
					up.setAttribute("part", "up"); 
					up.innerHTML = '+';
          up.addEventListener('click', () => {
            this.updateInputValue(thermostat.id, .5);
          });

          const el = document.createElement('div');
					el.setAttribute("part", "extra-thermostat-buttons"); 
          el.id = 'extra-thermostat-buttons';
          el.appendChild(down);
          el.appendChild(up);

          const shadow = thermostat.shadowRoot;
          const referenceNode = shadow.querySelector(
            '.webthing-number-property-contents'
          );
          referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
        }
      }
    }
    
    
    
    addThingsSearch() {
        //console.log("in addThingsSearch");
        
        if(document.getElementById('candle-theme-things-search-container') == null){
            let search_container = document.createElement('div');
            search_container.setAttribute("id", "candle-theme-things-search-container");
            let search_input = document.createElement('input');
            search_input.setAttribute("id", "candle-theme-things-search-input");
            search_input.setAttribute("type", "search");
            search_input.setAttribute("name", "candle-theme-search-input");
            search_input.setAttribute("placeholder", "search");

            search_container.appendChild(search_input);
            document.getElementById("things-view").appendChild(search_container);
        }
        
        const search_input = document.getElementById('candle-theme-things-search-input');
        if(search_input != null){
            /*
            if(document.activeElement !== search_input){
                //console.log("giving focus");
                search_input.focus();
            }
            */
            
            // This listener seems to sometimes disappear...
            search_input.onsearch = () => {
                //console.log("on-search");
                this.things_overview_search(8); // simulate backspace
            };
        }
        /*
        else{
            setTimeout(() => {
                if(search_input != null){
                    if(document.activeElement !== search_input){
                        //console.log("giving focus");
                        search_input.focus();
                    }
                }
            }, 100);
        }
        */
        
    }
    
    
    things_overview_search(code){
        const search_input_element = document.getElementById("candle-theme-things-search-input");
        const things = document.getElementById("things");
        const groups = document.getElementById("groups");
        
        

        const all_things = document.querySelectorAll('#things-view .thing');
        
        if(all_things == null){
            //console.log("no things found");
            return;
        }
        
        //console.log("all_things: ", all_things );
        
        const things_count = all_things.length;
        //console.log("things_count: " + things_count);

        if(search_input_element != null){
            
            const search_string = search_input_element.value.toLowerCase();
            //console.log("onkeyup search_string = " + search_string);
            //console.log("search_input_element. search_string: " + search_string + ", and things_count: " + things_count);

            
            if(search_string.length > 0){
                
                var shown_count = 0;
                var last_element = null;
                
                for (var i = 0; i < things_count; i++) {
                    //const child = all_things[i]; //things.childNodes[i];
                    //child.style.display = "none";
                    all_things[i].style.display = "none";
                }
                for (var i = 0; i < things_count; i++) {
                    const child = all_things[i]; //things.childNodes[i];
    
                    var thing_title = child.getElementsByClassName('thing-title')[0].innerHTML;
                    thing_title = thing_title.toLowerCase();
                    
                    if(thing_title.indexOf(search_string) !== -1){
                        child.style.display = "block";
                        shown_count++;
                        if(shown_count == 1){
                            last_element = child.getElementsByClassName('thing-details-link')[0];
                        }
                    }
    
                }
                
                //console.log("shown_count = " + shown_count);
                if(last_element != null && shown_count == 1 && code == 13){
                    //console.log("enter key press spotted when one device was shown");
                    last_element.click();
                }
                

            }
            else{
                for (var i = 0; i < things_count; i++) {
                      //things.childNodes[i].style.display = "block";
                      all_things[i].style.display = "block";
                }
            }
        }
           
    }
    
    
    
    // Press letter on the keyboard and it will filter the rule parts
    filter_rule_parts_list(code){
        
        //console.log("in filter_rule_parts_list. key code: ", code);
        console.log('document.activeElement.tagName: ', document.activeElement.tagName);
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SPAN"){
            //console.log("An input is already focused");
            code = 27;
        }
        
        if( code == 8 || code == 27 || code == 32){ // backspace, escape, space
            let parts = document.querySelectorAll("#rule-parts-list .rule-part");
            for (var i = 0; i < parts.length; ++i) {
                parts[i].style.display = 'inline-block';
            }
        }
        else if(code > 64 && code < 91){ // a-z
            let parts = document.querySelectorAll("#rule-parts-list .rule-part");
            for (var i = 0; i < parts.length; ++i) {
                
                const p_text = parts[i].getElementsByTagName('p')[0].innerText.toLowerCase();
                //console.log("p_text: " + p_text);
                //console.log(event.key + " =?= " + p_text.charAt(0));
                if( event.key != p_text.charAt(0) ){
                    parts[i].style.display = 'none';
                }
                else{
                    parts[i].style.display = 'inline-block';
                }
            }
        }
            
        
    }
    
    
    
    
    
  }

  new candleTheme();

})();
 