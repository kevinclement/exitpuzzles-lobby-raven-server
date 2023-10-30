### Auto start node app
```
sudo cp exitpuzzles.raven.service /etc/systemd/system/

# install service
sudo systemctl enable exitpuzzles.raven.service

# start service
sudo systemctl start exitpuzzles.raven.service

# to check status
sudo systemctl status exitpuzzles.raven.service

```

Afterwards, should be able to 'shutdown -r now' and see it come online with ssh and node service

### Start/Stop to run by hand
```
sudo systemctl stop exitpuzzles.raven.service
```

### Maestro
Maestro UscCmd needs to be installed on machine at /home/pi/.local/maestro/UscCmd

