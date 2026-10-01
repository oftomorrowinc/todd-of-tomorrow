---
title: "More New Web Magic"
description: "Man, it has been quite a while since I have seen new web hacks that have completely blown me away."
pubDate: "2008-02-08"
source: "wordpress"
dateIsCeiling: false
dateSource: "permalink"
originalKey: "wp:more-new-web-magic"
wordCount: 366
archive: true
---

Man, it has been quite a while since I have seen new web hacks that have completely blown me away. Today I get two! No sooner had I posed about Niall Kennedy’s Browser Sniffer magic than Ian Kennedy (no relation) sends me another really slick hack.

Ian pointed me to the Intense Debate website. I first met the Intense Debate guys last Summer when Eric & I were mentors at TechStars . They are a great group of guys. Since I only recently re-launched my blog, I haven’t have much of a need for a comments service. As such, I hadn’t seen their site in quite some time. (I have since agreed to try out the Disqus comment system as soon as they integrate OpenID ; but that is beside the point.)

When I first pulled up the site, I didn’t even notice the feature. Then it jumped out at me:

The site had auto-detected my blog. How cool is that!

So, how does it work? Like most great things, it is actually quite simple. Not only that, it uses MyBlogLog !!

When you first land on IntenseDebate.com, the site uses JavaScript to open MyBlogLog.com in an invisible Div.

The MyBlogLog website automatically redirects logged-in users to their MyBlogLog member page. (e.g. When I go to www.mybloglog.com I am redirected to http://www.mybloglog.com/buzz/members/toddsampson/ )

The script looks at the URL of the site shown in the invisible Div. If the URL is www.mybloglog.com, the script does nothing. If the URL has changed, it means that the person is a MyBlogLog member. The script then grabs the member name from the URL. (e.g. In my example above, it would grab “toddsampson”.)

The member name is then passed to a PHP script. While I can’t see the PHP source code, the script must open the page for the selected user and determine which blog to push into the signup box.

Like I said — simple. Simple, but brilliant. Doing this kind of thing will become much easier and much more powerful once the MyBlogLog API comes out of Beta very soon. But, in the mean time, thanks for making my day guys.

See Also: TechStars 2008 Now Accepting Applications
