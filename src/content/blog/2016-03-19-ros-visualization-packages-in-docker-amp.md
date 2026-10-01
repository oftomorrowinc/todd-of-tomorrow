---
title: "ROS Visualization Packages in Docker"
description: "It my last post we setup a usb camera to work as a ROS sensor inside a Docker container."
pubDate: "2016-03-19"
source: "tumblr"
dateIsCeiling: true
dateSource: "capture-ceiling"
originalKey: "tb:131965350342"
wordCount: 373
tumblrTags: "ROS Docker Image_view X11"
archive: true
---

It my last post  we setup a usb camera to work as a ROS sensor inside a Docker container.  Now let’s get the image stream from that webcam displaying in ROS’s image_view via the image_pipeline package.

First run this on the host computer to authorize containers to access the X server from the docker container:

xhost +

Next we create our Dockerfile, which will be a bit more complex than the usbcam example since we need to setup user and group permissions that match the host computer.  Be sure to update the uid and gid to match your user on the host machine.

FROM ros:indigo-ros-core

RUN apt-get -y update

RUN apt-get -y install ros-indigo-image-pipeline

ENV uid 1000 # IMPORTANT: Update to the `id -u` value on your computer

ENV gid 1000 # IMPORTANT: Update to the `id -g` value on your computer

RUN export uid=${uid} gid=${gid} && \

mkdir -p /home/ros && \

echo “ros:x:${uid}:${gid}:ros,,,:/home/ros:/bin/bash” >> /etc/passwd && \

echo “ros:x:${uid}:” >> /etc/group && \

echo “ros ALL=(ALL) NOPASSWD: ALL” > /etc/sudoers.d/ros && \

chmod 0440 /etc/sudoers.d/ros && \

chown ${uid}:${gid} -R /home/ros

USER ros

ENV HOME /home/ros

Now we can add a launch config to the docker-compose.yml we created in the last post.  Note the shared X11-unix volume and environment DISPLAY.  These are needed to allow launching X window visualizations.

image_view:

build: .

\# image: toddsampson/ros-indigo-image_pipeline

container_name: image_view

hostname: image_view

name: image_view

volumes_from:

- “rosmaster”

\# net: rosdocker

volumes:

- “/tmp/.X11-unix:/tmp/.X11-unix”

environment:

- “DISPLAY=$DISPLAY”

- “ROS_HOSTNAME=image_view”

- “ROS_MASTER_URI=http://rosmaster:11311”

command: rosrun image_view image_view image:=/image_raw

The rosrun command calls the image_view ROS package to show the image stream from the usbcam setup in the last post.  The basic image_raw source and default baud rate settings worked for me.  You may need to update them for your system.

Once the above is added to your docker-compose file, and the rosmaster & usbcam containers are running, you can launch image_view with the following command:

docker-compose —x-networking up image_view

To make things easier I have posted a full example on Github .  I also have shared pre-built Docker Images on Docker Hub .

As always, feel free to hit me at @toddsampson on Twitter with any questions or thoughts you have on ROS, Docker, or anything else.
