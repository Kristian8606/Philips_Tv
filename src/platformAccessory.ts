/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable max-len */
import { Service, PlatformAccessory } from 'homebridge';

import { ExampleHomebridgePlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Philips_Remote_Tv {
  private tvService!: Service;
  
  axios = require('axios');
  cmd;
  ipAdress;
  state = false;
  
  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    
  ) {
     
    
    
    
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.mac_adress);


    this.cmd = accessory.context.device.mac_adress;
    this.ipAdress = accessory.context.device.ip_adress;
    //console.log(accessory.context.device.ip_adress);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.

    this.accessory.category = this.platform.api.hap.Categories.TELEVISION;

    // add the tv service
    this.tvService = this.accessory.getService(this.platform.Service.Television) || this.accessory.addService(this.platform.Service.Television);


    // set the tv name
    this.tvService.setCharacteristic(this.platform.Characteristic.ConfiguredName, accessory.context.device.tv);
    this.tvService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.tv);


    // set sleep discovery characteristic
    this.tvService.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    // handle on / off events using the Active characteristic
    this.tvService.getCharacteristic(this.platform.Characteristic.Active)
      .on('set', (newValue, callback) => {
        this.platform.log.info('set Active => setNewValue: ' + newValue);
        if(newValue){
          this.wakeOnLan(this.cmd);
          this.state = true;
        }else{
          this.http('Standby');
          this.state = false;
        }
        this.tvService.updateCharacteristic(this.platform.Characteristic.Active, 1);
        callback(null);
      });

    this.tvService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);

    // handle input source changes
    this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .on('set', (newValue, callback) => {

        // the value will be the value you set for the Identifier Characteristic
        // on the Input Source service that was selected - see input sources below.
        
        this.platform.log.info('set Active Identifier => setNewValue: ' + newValue);
        if(newValue === 1){
          this.http('Home');
        }else if (newValue === 2){
          this.http('Source');
        }else if (newValue === 3){
          this.http('Mute');
        }else if (newValue === 4){
          this.http('AmbilightOnOff');
        }
       

        callback(null);
      });

    // handle remote control input
    this.tvService.getCharacteristic(this.platform.Characteristic.RemoteKey)
      .on('set', (newValue, callback) => {
        switch(newValue) {
          case this.platform.Characteristic.RemoteKey.REWIND: {
            this.platform.log.info('set Remote Key Pressed: REWIND');
            break;
          }
          case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
            this.platform.log.info('set Remote Key Pressed: FAST_FORWARD');
            break;
          }
          case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {
            this.platform.log.info('set Remote Key Pressed: NEXT_TRACK');
            break;
          }
          case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {
            this.platform.log.info('set Remote Key Pressed: PREVIOUS_TRACK');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_UP: {
            this.platform.log.info('set Remote Key Pressed: ARROW_UP');
            this.http('CursorUp');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
            this.platform.log.info('set Remote Key Pressed: ARROW_DOWN');
            this.http('CursorDown');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
            this.platform.log.info('set Remote Key Pressed: ARROW_LEFT');
            this.http('CursorLeft');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
            this.platform.log.info('set Remote Key Pressed: ARROW_RIGHT');
            this.http('CursorRight');
            break;
          }
          case this.platform.Characteristic.RemoteKey.SELECT: {
            this.platform.log.info('set Remote Key Pressed: SELECT');
            this.http('Confirm');
            break;
          }
          case this.platform.Characteristic.RemoteKey.BACK: {
            this.platform.log.info('set Remote Key Pressed: BACK');
            this.http('Back');
            break;
          }
          case this.platform.Characteristic.RemoteKey.EXIT: {
            this.platform.log.info('set Remote Key Pressed: EXIT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
            this.platform.log.info('set Remote Key Pressed: PLAY_PAUSE');
            this.http('Home');
            break;
          }
          case this.platform.Characteristic.RemoteKey.INFORMATION: {
            this.platform.log.info('set Remote Key Pressed: INFORMATION');
            this.http('Info');
            break;
          }
        }

        // don't forget to callback!
        callback(null);
      });

    /**
     * Create a speaker service to allow volume control
     */

    const speakerService = this.accessory.addService(this.platform.Service.TelevisionSpeaker);

    speakerService
      .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
      .setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);

    // handle volume control
    speakerService.getCharacteristic(this.platform.Characteristic.VolumeSelector)
      .on('set', (newValue, callback) => {
        this.platform.log.info('set VolumeSelector => setNewValue: ' + newValue);
        if(!newValue){
          this.http('VolumeUp');
        }else{
          this.http('VolumeDown');
        }
        
        callback(null);
      });

    /**
     * Create TV Input Source Services
     * These are the inputs the user can select from.
     * When a user selected an input the corresponding Identifier Characteristic
     * is sent to the TV Service ActiveIdentifier Characteristic handler.
     */

    // HDMI 1 Input Source
    const hdmi1InputService = this.accessory.addService(this.platform.Service.InputSource, 'menu', 'MENU');

    hdmi1InputService
      .setCharacteristic(this.platform.Characteristic.Identifier, 1)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'MENU')
      .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI);
    this.tvService.addLinkedService(hdmi1InputService); // link to tv service

    // HDMI 2 Input Source
    const hdmi2InputService = this.accessory.addService(this.platform.Service.InputSource, 'source', 'Source');
    hdmi2InputService
      .setCharacteristic(this.platform.Characteristic.Identifier, 2)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Source')
      .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI);
    this.tvService.addLinkedService(hdmi2InputService); // link to tv service

    // Netflix Input Source
    const netflixInputService = this.accessory.addService(this.platform.Service.InputSource, 'mute', 'Mute');
    netflixInputService
      .setCharacteristic(this.platform.Characteristic.Identifier, 3)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Mute')
      .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI);
    this.tvService.addLinkedService(netflixInputService); // link to tv service

    const AmbilightInputService = this.accessory.addService(this.platform.Service.InputSource, 'ambilightonoff', 'AmbilightOnOff');

    AmbilightInputService
      .setCharacteristic(this.platform.Characteristic.Identifier, 4)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'AmbilightOnOff')
      .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI);
    this.tvService.addLinkedService(AmbilightInputService); // link to tv service

    

    
    setInterval(() => {
      this.ping(this.ipAdress);
      // push the new value to HomeKit
      // motionSensorTwoService.updateCharacteristic(this.platform.Characteristic.MotionDetected, !motionDetected);

      //this.platform.log.debug('Triggering motionSensorTwoService:', !motionDetected);
    }, 5000);

  }

  http(valData){
    
    const data = JSON.stringify({'key': ''+valData+'' });
    this.platform.log.debug(valData);
    const config = {
      method: 'post',
      url: 'http://'+this.ipAdress+':1925/6/input/key',
      headers: { 
        'Content-Type': 'text/plain',
      },
      data : data,
    };

    this.axios(config)
      .then((response) => {
        const val = JSON.stringify(response.data);
        this.platform.log.debug(JSON.parse(val));
      })
      .catch((error) => {
        this.platform.log.debug(error);
      });
  }

  wakeOnLan(command){
    const wol = require('wake_on_lan');
    

    wol.wake(''+command+'');

    wol.wake(''+command+'', (error) => {
      if (error) {
        // handle error
        // console.log(error);
      } else {
        // done sending packets
        // console.log('Send WOL '+ command);
      }
    });
  }

  ping(ip_adr){
    const ping = require('ping');
 
    const hosts = [''+ip_adr+''];
    hosts.forEach((host)=> {
      ping.sys.probe(host, (isAlive)=> {
        //const msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
        // console.log(msg);
        if(isAlive !== this.state){
          this.state = isAlive;
          this.tvService.updateCharacteristic(this.platform.Characteristic.Active, isAlive);
          // console.log(isAlive);
          // return isAlive;
        }
        
        // return false;
      });
    });

  }
  
}
  


