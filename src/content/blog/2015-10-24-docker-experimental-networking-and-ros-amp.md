---
title: "Docker Experimental Networking and ROS"
description: "When I first saw Docker, it was love at first sight."
pubDate: "2015-10-24"
source: "tumblr"
dateIsCeiling: true
dateSource: "capture-ceiling"
originalKey: "tb:131227320927"
wordCount: 835
archive: true
---

When I first saw Docker, it was love at first sight.  Adding network-effects, both human and tech, to Linux containers made so much sense.  Packaged, distributed processing units can finally join distributed networking and storage on the internet.

We ( Cloudspace ) immediately jumped in to use Docker for a number of internal projects as well as projects for a few brave clients. (Thanks guys!)  These projects ranged from traditional DevOps and a database backup system to a distributed job runner that allowed us to run jobs with the extra compute cycles on our office laptops – all with great results.

Then we tried using Docker with the Robot Operating System (ROS) …

Due to conflicts between the networking models of Docker, which required you to open ports for communication between containers on launch, and ROS, which uses a “graph”  of dynamic communication systems under-the-hood, the two systems didn’t play nicely together.  This was especially true if you try to keep with Docker’s “one process per container” best practice.  So we shelved the idea

Fast-forward two and a half years. (I can’t believe it has been that long!) It probably goes without saying, but both Docker and ROS have come a long way.  ROS has even put out their own official containers for  base system and perception modules on Docker Hub .  As the documentation on this page calls out, to properly use ROS with Docker containers you need to use Docker’s experimental networking.

Being experimental, Docker’s new networking is changing fast.  So much so that the instructions on the ROS Docker Hub page no longer work.  Several features and flags have been replaced.  Further, the docs don’t touch on how to use ROS with Docker Compose to design a large scale system, such as a ROS-based robot.  As Docker’s experimental networking nears launch – Docker Compose just put out a release candidate  with Docker’s new networking – I figured it was time to try ROS with Docker again.

Long-story short, outside time spent digging into source code trying to discover how undocumented parts of Docker networking works, it is a complete success.  The remainder of this post is a quick summary of how to setup a Linux machine to use the new network with ROS.

Getting Docker Experimental Networking

Run the following to install Docker with the experimental features (be sure to enter your password when prompted):

curl -sSL https://experimental.docker.com/ | sh

November 9, 2015 Update: Docker Networking is no longer experimental.  As such, you should install the latest Docker production release.  See http://toddsampson.com/post/132906116887/docker-networking-no-longer-experimental  for more information.

Once Docker is installed, you need to make the ROS Tutorial Docker image as described in the ROS instructions on Docker Hub.  Create a new directory, cd into it, and run the following:

printf "FROM ros:indigo-ros-base\nRUN apt-get update && apt-get install -y ros-indigo-ros-tutorials ros-indigo-common-tutorials && rm -rf /var/lib/apt/lists/ \n” > Dockerfile

docker build –tag ros:ros-tutorials .

If all went well, you will have a ros:ros-tutorial Docker image.  Now we can create a new Docker network:

docker network create foo

To use the network, open three terminal windows or tabs.  We will run one of the following commands in each terminal.  These will spin up roscore (master), a talker and a listener using the rostutorial image.  Be sure to launch master first. (Note: These are based on the ROS Docker Hub page, but updated for changes to Docker networking.)

docker run -it –rm –net=foo –name master ros:ros-tutorials  roscore

docker run -it –rm –net=foo –env ROS_HOSTNAME=talker –env ROS_MASTER_URI=http://master:11311 –name talker ros:ros-tutorials  rosrun roscpp_tutorials talker

docker run -it –rm –net=foo –env ROS_HOSTNAME=listener –env ROS_MASTER_URI=http://master:11311 –name listener ros:ros-tutorials  rosrun roscpp_tutorials listener

Again, if all went well, you should see messages published by the talker being displayed by the listener subscriber.

ROS Networking with Docker Compose 1.5.0 RC1

Now that we have Docker’s new networking working from the command line, let’s setup Docker Compose to automate spinning-up our container network.

First we need to install the release candidate for 1.5.0 by running the following in terminal:

sudo su

curl -L https://github.com/docker/compose/releases/download/1.5.0rc1/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose

chmod +x /usr/local/bin/docker-compose

exit

Next create a Docker Compose YAML file to launch our ROS container network:

printf ‘master:\n  image: ros:ros-tutorials\n  container_name: master\n  command: roscore \ntalker:\n  image: ros:ros-tutorials\n  container_name: talker\n  environment:\n      - “ROS_HOSTNAME=talker”\n      - “ROS_MASTER_URI=http://master:11311”\n  command: rosrun roscpp_tutorials talker\nlistener:\n  image: ros:ros-tutorials\n  container_name: listener\n  environment:\n      - “ROS_HOSTNAME=listener”\n      - “ROS_MASTER_URI=http://master:11311”\n  command: rosrun roscpp_tutorials listener\n’ > docker-compose.yml

Now start the network:

docker-compose –x-networking up -d

To verify that the containers all started correctly run:

docker ps

And to verify that the listener is receiving messages correctly:

docker logs listener

One final note, Docker Compose will automatically create a new network based on the name of the directory containing the config YAML file.  You can see this network with:

docker network ls

Docker’s new networking and ROS have so much potential.  I will be sure to post more as I run further tests.  Feel free to follow me here or on twitter at @toddsampson if you are interested in learning more.
