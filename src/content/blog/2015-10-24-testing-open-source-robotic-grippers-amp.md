---
title: "Testing Open Source Robotic Grippers"
description: "In order to test out the motion/force/flex sensing glove I have been working on integrating with ROS , I need a few robotic grippers."
pubDate: "2015-10-24"
source: "tumblr"
dateIsCeiling: true
dateSource: "capture-ceiling"
originalKey: "tb:130632327397"
wordCount: 306
tumblrTags: "robots gripper arduino open source"
archive: true
---

In order to test out the motion/force/flex sensing glove I have been working on integrating with ROS , I need a few robotic grippers.  (Think hands for robots.)  As always, I’m starting with checking out what is out there in open source land.

The first gripper we tried to build was Mad Mare Studio’s Medium-Duty Robot Gripper .  While I dig the overall design, I realized there is no way one of our RepRap Prusa printers was going to successfully print the two largest parts due to several inch long bridges – which frankly don’t appear to be needed.  (I discovered this two hours in to the second to last print… Le sigh.)  I may try modify the parts an reprint them soon.

I just finished building JJShortcut’s Standard Servo Gripper .  I picked this gripper since it could be printed on a standard 3d printer, cut on a laser cutter or machined on a CNC machine.  I went for MDF on the CNC machine since it was just for testing.

The original build of JJ’s SSG didn’t work too well.  I’m sure it was something I did in the machining, but I’m not sure if I machined the holes too tight or did something else.  I ended up modifying one of the gears using a drill press so I could attach a round, metal servo horn.

This modification worked like a charm, as you can see in the following video showing the gripper doing a simple sweep motion controlled by an Arduino:

This gripper didn’t have enough torque or grip strength for my needs, but it was great to spark ideas for future builds.  I am still debating if I should just design my own gripper or try building one from the Yale OpenHand Project – which look amazing but appear incredibly complex to make.
