# Smart-Entrance

A building management system for controling door locks

# Guide

node server and mongodb should be runned to use project.

project location: /home/pi/Smart-Entrance
database location: /db

[mongodb query guide](https://docs.mongodb.com/manual/tutorial/query-documents/)

Raspberry startup commands:

Sudo nano /etc/rc.local
``` bash
cd /home/pi/mongodb/core/
sudo ./mongod --repair &
sleep 2s &
sudo ./mongod &
sleep 1s &
cd / &
node /home/pi/Smart-Entrance/bin/www &
sudo node /home/pi/node_modules/node-red/red.js
```

opening chrome fullscreen (kiosk mode)

sudo nano /home/pi/.config/lxsession/LXDE-pi/autostart
```
@lxpanel --profile LXDE-pi
#@pcmanfm --desktop --profile LXDE-pi
@pcmanfm --desktop
@xscreensaver -no-splash

@xset s off
@xset -dpms
@xset s noblank
@sed -i 's/"exited_cleanly": false/"exited_cleanly": true/' ~/.config/chromium-browser/D$
@chromium-browser --noerrdialogs --disable-infobars --kiosk --disable-pinch --overscroll-history-navigation=0
```


Crontab automated commands
crontab -l
```
sudo nano /home/pi/Documents/mycronjobs.txt
```

Lcd settings:
Sudo nano /boot/config.txt
```
framebuffer_width=600
framebuffer_height=1024
dtparam=audio=on
max_usb_current=1
hdmi_group=2
hdmi_mode=87
hdmi_cvt 1024 600 60 6 0 0 0
hdmi_drive=1
enable_uart=1
```
