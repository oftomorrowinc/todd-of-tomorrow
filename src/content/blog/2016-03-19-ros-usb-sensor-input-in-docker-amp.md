---
title: "ROS USB Sensor Input in Docker"
description: "In my last post I showed how to get ROS working under Docker using a simple talker & listener example."
pubDate: "2016-03-19"
source: "tumblr"
dateIsCeiling: true
dateSource: "capture-ceiling"
originalKey: "tb:131447984382"
wordCount: 344
tumblrTags: "ros docker usb sensors"
archive: true
---

In my last post I showed how to get ROS working under Docker using a simple talker & listener example.  Using this method will work for most ROS packages that provide publisher & subscriber functionality.  In order to use ROS packages that require access to external sensors in Docker requires a bit of additional configuration.

As an example, let’s publish in an image stream from a webcam to ROS.

Since many of Apple’s newer iSight cameras aren’t compatible with the main camera packages in ROS, I temporarily disconnected the RobotGeek Webcam from my 21st Century Robot HR-OS1 and plugged it into a USB slot on my computer.

With the USB camera connected, we can get it working in ROS under Docker. First we create a wrapper around the libuvc-ros meta-package in a Dockerfile:

FROM ros:indigo-ros-core

RUN apt-get -y update

RUN apt-get -y install ros-indigo-libuvc-ros

Next we make a Docker Compose entry for the webcam:

usbcam:

image: toddsampson/ros-indigo-usbcam

name: usbcam

container_name: usbcam

net: rosdocker

devices:

- “/dev/bus/usb:/dev/bus/usb”

hostname: usbcam

environment:

- “ROS_HOSTNAME=usbcam”

- “ROS_MASTER_URI=http://rosmaster:11311”

command: rosrun libuvc_camera camera_node _height:=480 _width:=640 _vendor:=2084 _video_mode:=uncompressed _frame_rate:=30

A few things to note about the above:

The lines with `devices:  - “/dev/bus/usb:/dev/bus/usb”` allow the container to access the USB devices connected to the computer running Docker.  More importantly, it does so in a way that doesn’t require you to run the container in privileged mode as required in Docker’s earlier days.

You may need to tweak the settings for your specific camera.

If you want to use the Dockerfile listed above instead of the one I have on Docker Hub, replace `image: toddsampson/ros-indigo-usbcam` with `build .`

Finally, for a full example, including a rosmaster container running roscore and the launch command, check out the source code on Github: https://github.com/toddsampson/ros-docker-usbcam/tree/indigo .

This will get you up-and-running with external sensors in Docker.  In the next post I will show how to visualize the data we receive in a separate Docker container using one of the ROS visualization packages.  If you have questions or want to learn more, follow me on Twitter: @toddsampson
