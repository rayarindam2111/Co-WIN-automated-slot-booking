# ![icon](https://user-images.githubusercontent.com/37744870/119220867-3056e400-bb0a-11eb-876e-37cf937ae02d.png) Co-WIN automated slot booking
##### _Automatically book vaccine slots on Co-WIN as and when they become available_

This is a browser extension that aims to automatically book vaccine slots for registered beneficiaries on the [Co-WIN website](https://selfregistration.cowin.gov.in/) as per availability. Options for registration are obtained beforehand and a booking is attempted once a slot becomes available. Co-WIN uses Bearer tokens for authentication that automatically expire after 15 minutes. If a slot becomes available after a user is automatically logged out, an audio alert is sent out and the booking is continued after successful login.

## Setup

> This is dev version of the extension and needs to be set up manually; porting to the extension store is a work in progress.

> The setup procedure is demonstrated for Google Chrome.
> A similar procedure should be followed for other webkit browsers as well.

 - Download the repository as a zipped file from [GitHub](https://github.com/rayarindam2111/Co-WIN-automated-slot-booking/) and extract the files in a directory. The location of this directory cannot change once it has been set up.
 
 ![1](https://user-images.githubusercontent.com/37744870/119220364-d2c19800-bb07-11eb-8d96-92a2df34b802.png)

 - Open Google Chrome. Navigate to **More Tools > Extensions**.
 
 ![2](https://user-images.githubusercontent.com/37744870/119220367-d48b5b80-bb07-11eb-8d95-86847a783b77.png)

 - Click on **Developer Mode**.
 
 ![3](https://user-images.githubusercontent.com/37744870/119220369-d523f200-bb07-11eb-8752-90c67b2b15c3.png)

 - Click on **Load Unpacked**.
 
 ![4](https://user-images.githubusercontent.com/37744870/119220370-d5bc8880-bb07-11eb-8e46-5cec5d5a654b.png)

 - Browse to the directory where you extracted the files and click on **Select Folder**. Make sure you go inside the **CoWIN Automated slot booking** directory.
 
 ![5](https://user-images.githubusercontent.com/37744870/119220373-d6551f00-bb07-11eb-9e15-d55365eacb7d.png)

 - The extension should show up on the Extensions page.
 
 ![6](https://user-images.githubusercontent.com/37744870/119220374-d6edb580-bb07-11eb-8137-65159b19c301.png)

 - Visit [https://selfregistration.cowin.gov.in/](https://selfregistration.cowin.gov.in/) and login using your phone number and OTP. A yellow icon should appear on the bottom right corner.
 
 ![7](https://user-images.githubusercontent.com/37744870/119220375-d7864c00-bb07-11eb-892a-be0c9b21b99b.png)

 - Once you have logged in, click on the icon to open the options page. Make sure you fill in all the options correctly and then click on Start to start the automatic vaccine registration process.
 
 ![8](https://user-images.githubusercontent.com/37744870/119220376-d81ee280-bb07-11eb-9b0b-2268e764a227.png)

 - If you get automatically logged out and a slot becomes available, the page sends out an audio alert and prompts you to re-login. Thereafter, the vaccine booking process is completed with the already provided options after re-login.

## License
GNU General Public License v3.0
