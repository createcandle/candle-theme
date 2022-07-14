"""Candle Theme API handler."""


import os
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib'))
import json
import datetime
import requests
import threading

try:
    from gateway_addon import APIHandler, APIResponse, Database
    #print("succesfully loaded APIHandler and APIResponse from gateway_addon")
except:
    print("Import APIHandler and APIResponse from gateway_addon failed. Use at least WebThings Gateway version 0.10")
    sys.exit(1)



_TIMEOUT = 3

_CONFIG_PATHS = [
    os.path.join(os.path.expanduser('~'), '.webthings', 'config'),
]

if 'WEBTHINGS_HOME' in os.environ:
    _CONFIG_PATHS.insert(0, os.path.join(os.environ['WEBTHINGS_HOME'], 'config'))




class CandleThemeAPIHandler(APIHandler):
    """Candle API handler."""

    def __init__(self, verbose=False):
        """Initialize the object."""
        #print("INSIDE API HANDLER INIT")
        
        
        self.addon_name = 'candle-theme'
        self.running = True

        self.server = 'http://127.0.0.1:8080'
        self.DEBUG = False
            
        self.persistent_data = {'background_color':"",'hide_floorplan':False, 'zoom':'100%', 'collections':{}}
            

        # Paths
        # Get persistent data
        try:
            self.persistence_file_dir = os.path.join(self.user_profile['dataDir'], self.addon_name)
            self.persistence_file_path = os.path.join(self.user_profile['dataDir'], self.addon_name, 'persistence.json')
            if not os.path.isdir(self.persistence_file_dir):
                os.mkdir(self.persistence_file_dir)
        except:
            try:
                if self.DEBUG:
                    print("setting persistence file path failed, will try older method.")
                self.persistence_file_path = os.path.join(os.path.expanduser('~'), '.webthings', 'data', self.addon_name,'persistence.json')
            except:
                if self.DEBUG:
                    print("Double error making persistence file path")
                self.persistence_file_path = "/home/pi/.webthings/data/" + self.addon_name + "/persistence.json"
        
        if self.DEBUG:
            print("Current working directory: " + str(os.getcwd()))
        
        
        first_run = False
        try:
            with open(self.persistence_file_path) as f:
                self.persistent_data = json.load(f)
                if self.DEBUG:
                    print("Persistence data was loaded succesfully.")
                
        except:
            first_run = True
            print("Could not load persistent data (if you just installed the add-on then this is normal)")
            self.persistent_data = {'background_color':"",'hide_floorplan':False, 'collections':{}}
            self.save_persistent_data()

        if not 'collections' in self.persistent_data:
            self.persistent_data['collections'] = {}
            
        if not 'zoom' in self.persistent_data:
            self.persistent_data['zoom'] = '100%'
            
        if not 'zoom_everywhere' in self.persistent_data:
            self.persistent_data['zoom_everywhere'] = False
            
        if not 'developer' in self.persistent_data:
            self.persistent_data['developer'] = False

        if not 'allow_pinch_to_zoom' in self.persistent_data:
            self.persistent_data['allow_pinch_to_zoom'] = False
            
        if not 'hide_virtual_keyboard' in self.persistent_data:
            self.persistent_data['hide_virtual_keyboard'] = False     
            
        if not 'menu_list' in self.persistent_data:
            self.persistent_data['menu_list'] = False
        
        if not 'last_log_view_time' in self.persistent_data:
            self.persistent_data['last_log_view_time'] = None;
        
            

        # LOAD CONFIG
        try:
            self.add_from_config()
            self.save_persistent_data()
        except Exception as ex:
            print("Error loading config: " + str(ex))
        
        
        if self.DEBUG:
            print("self.persistent_data is now: " + str(self.persistent_data))
        

        # Is there user profile data?    
        #try:
        #    print(str(self.user_profile))
        #except:
        #    print("no user profile data")

            
        # Intiate extension addon API handler
        
        try:
            manifest_fname = os.path.join(
                os.path.dirname(__file__),
                '..',
                'manifest.json'
            )

            with open(manifest_fname, 'rt') as f:
                manifest = json.load(f)

            APIHandler.__init__(self, manifest['id'])
            self.manager_proxy.add_api_handler(self)
            

            if self.DEBUG:
                #print("self.manager_proxy = " + str(self.manager_proxy))
                print("Created new API HANDLER: " + str(manifest['id']))
        
        except Exception as e:
            print("Failed to init UX extension API handler: " + str(e))

        


    # Read the settings from the add-on settings page
    def add_from_config(self):
        """Attempt to read config data."""
        try:
            database = Database(self.addon_name)
            if not database.open():
                print("Could not open settings database")
                return
            
            config = database.load_config()
            database.close()
            
        except Exception as ex:
            print("Error! Failed to open settings database: " + str(ex))
        
        if not config:
            print("Error loading config from database")
            return
        
        
        if 'Debugging' in config:
            self.DEBUG = bool(config['Debugging'])
            if self.DEBUG:
                print("-Debugging preference was in config: " + str(self.DEBUG))
                
        if 'Hide floorplan' in config:
            self.persistent_data['hide_floorplan'] = bool(config['Hide floorplan'])
            if self.DEBUG:
                print("-Hide floorplan preference was in config: " + str(self.persistent_data['hide_floorplan']))
        
        if 'Zoom' in config:
            self.persistent_data['zoom'] = str(config['Zoom'])
            if self.DEBUG:
                print("-Zoom preference was in config: " + str(self.persistent_data['zoom']))
                
        if 'Use zoom everywhere' in config:
            self.persistent_data['zoom_everywhere'] = bool(config['Use zoom everywhere'])
            if self.DEBUG:
                print("-Use zoom everywhere preference was in config: " + str(self.persistent_data['zoom_everywhere']))
        
        if 'Allow pinch-to-zoom' in config:
            self.persistent_data['allow_pinch_to_zoom'] = bool(config['Allow pinch-to-zoom'])
            if self.DEBUG:
                print("-Pinch to zoom preference was in config: " + str(self.persistent_data['allow_pinch_to_zoom']))
                
        if 'Hide virtual keyboard' in config:
            self.persistent_data['hide_virtual_keyboard'] = bool(config['Hide virtual keyboard'])
            if self.DEBUG:
                print("-Hide virtual keyboard preference was in config: " + str(self.persistent_data['hide_virtual_keyboard']))
        
        if 'Show main menu as a list' in config:
            self.persistent_data['menu_list'] = bool(config['Show main menu as a list'])
            if self.DEBUG:
                print("-Show main menu as a list preference was in config: " + str(self.persistent_data['menu_list']))
                
                
                
        if 'Show developer options' in config:
            self.persistent_data['developer'] = bool(config['Show developer options'])
            if self.DEBUG:
                print("-Show developer options preference was in config: " + str(self.persistent_data['developer']))
        
        # Background color
        try:
            if 'Background color' in config:
                self.persistent_data['background_color'] = str(config['Background color'])
                if self.DEBUG:
                    print("-Background color is present in the config data.")
            else:
                self.persistent_data['background_color'] = ""
        except Exception as ex:
            print("Error loading background color preference from settings: " + str(ex))
        
        
        if self.DEBUG:
            print("config: " + str(config))
        
        # Api token
        #try:
        #    if 'Authorization token' in config:
        #        self.token = str(config['Authorization token'])
        #        print("-Authorization token is present in the config data.")
        #except:
        #    print("Error loading api token from settings")
        

        






#
#  HANDLE REQUEST
#

    def handle_request(self, request):
        """
        Handle a new API request for this handler.

        request -- APIRequest object
        """
        
        try:
        
            if request.method != 'POST':
                return APIResponse(status=404)
            
            if request.path == '/ajax':

                try:
                    
                    action = str(request.body['action']) 
                    
                    if action == 'init':
                        if self.DEBUG:
                            print("in init")
                        
                        return APIResponse(
                          status=200,
                          content_type='application/json',
                          content=json.dumps({'debug': self.DEBUG, 
                                              'background_color':self.persistent_data['background_color'], 
                                              'hide_floorplan':self.persistent_data['hide_floorplan'], 
                                              'zoom':self.persistent_data['zoom'], 
                                              'zoom_everywhere':self.persistent_data['zoom_everywhere'], 
                                              'allow_pinch_to_zoom':self.persistent_data['allow_pinch_to_zoom'], 
                                              'hide_virtual_keyboard':self.persistent_data['hide_virtual_keyboard'],
                                              'developer':self.persistent_data['developer'],
                                              'menu_list':self.persistent_data['menu_list']
                                          }),
                        )
                        
                    elif action == 'get_collections':
                        return APIResponse(
                          status=200,
                          content_type='application/json',
                          content=json.dumps({'state' : 'ok', 'collections': self.persistent_data['collections']}),
                        )
                        
                    elif action == 'save_collections':
                        
                        state = 'ok'
                        try:
                            self.persistent_data['collections'] = request.body['collections']
                            self.save_persistent_data()
                            
                        except Exception as ex:
                            if self.DEBUG:
                                print("Error saving collections: " + str(ex))
                            state = 'error'
                        
                        return APIResponse(
                          status=200,
                          content_type='application/json',
                          content=json.dumps({'state' : state, 'collections': self.persistent_data['collections']}),
                        )
                        
                        
                    elif action == 'save_last_logs_view_time':
                        
                        current_time = datetime.datetime.now()
                        self.persistent_data['last_log_view_time'] = current_time.timestamp() #int(time.time())
                        self.save_persistent_data()
                        
                        return APIResponse(
                          status=200,
                          content_type='application/json',
                          content=json.dumps({'state' : True}),
                        )
                        
                    elif action == 'get_last_logs_view_time':
                        
                        last_log_view_time = 'unknown'
                        
                        try:
                            if self.persistent_data['last_log_view_time'] != None:
                                date_object = datetime.datetime.fromtimestamp(self.persistent_data['last_log_view_time'])
                                last_log_view_time = date_object.strftime("%A %e %B %Y at %H:%M")#str(date_object)
                        except Exception as ex:
                            if self.DEBUG:
                                print("Error creating last_log_view date string: " + str(ex))
                        
                        return APIResponse(
                          status=200,
                          content_type='application/json',
                          content=json.dumps({'state' : True,'last_log_view_time':last_log_view_time}),
                        )
                        
                    else:
                        if self.DEBUG:
                            print("unsupported ajax action: " + str(action))
                        return APIResponse( status=404 )
                        
                        
                    
                    
                    
                        
                        
                except Exception as ex:
                    if self.DEBUG:
                        print("Error while handling request: " + str(ex))
                    return APIResponse(
                        status=500,
                        content_type='application/json',
                        content=json.dumps("Error in API handler"),
                    )
                    
            else:
                return APIResponse(status=404)
                
        except Exception as e:
            if self.DEBUG:
                print("Failed to handle UX extension API request: " + str(e))
            return APIResponse(
                status=500,
                content_type='application/json',
                content=json.dumps("API Error"),
            )


    def unload(self):
        self.running = False
        if self.DEBUG:
            print("Candle theme shutting down")




    def cancel_pairing(self):
        """Cancel the pairing process."""
        #print("END OF PAIRING -----------------------------")




#
#  SAVE TO PERSISTENCE
#

    def save_persistent_data(self):
        #if self.DEBUG:
        #print("Saving to persistence data store at path: " + str(self.persistence_file_path))
            
        try:
            if not os.path.isfile(self.persistence_file_path):
                open(self.persistence_file_path, 'a').close()
                if self.DEBUG:
                    print("Created an empty persistence file")
            #else:
            #    if self.DEBUG:
            #        print("Persistence file existed. Will try to save to it.")


            with open(self.persistence_file_path) as f:
                if self.DEBUG:
                    print("saving persistent data: " + str(self.persistent_data))
                json.dump( self.persistent_data, open( self.persistence_file_path, 'w+' ) )
                return True

        except Exception as ex:
            print("Error: could not store data in persistent store: " + str(ex) )
            return False



    
    
    