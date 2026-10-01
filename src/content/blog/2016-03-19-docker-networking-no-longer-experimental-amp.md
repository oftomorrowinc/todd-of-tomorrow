---
title: "Docker Networking no longer experimental"
description: "If you are running through any of my previous tutorials on ROS and Docker using the experimental networking feature, you should know that networking is no…"
pubDate: "2016-03-19"
source: "tumblr"
dateIsCeiling: true
dateSource: "capture-ceiling"
originalKey: "tb:132906116887"
wordCount: 106
tumblrTags: "Docker Networking ROS"
archive: true
---

If you are running through any of my previous tutorials on ROS and Docker using the experimental networking feature, you should know that networking is no longer experimental.  It has been released in the 1.9.0 production tag.

Sadly, it appears that the current 1.10.0 experimental branch of Docker is completely hosed based on notes from a few people that reached out to me.  As such, I recommend uninstalling experimental Docker as described here:  http://docs.docker.com/engine/installation/ubuntulinux/#uninstallation

Then install Docker 1.9.0 using:

wget -qO- https://get.docker.com/ | sh

Be sure to re-add your user to the docker group as the install recommends and logout/login to active the new group settings.
