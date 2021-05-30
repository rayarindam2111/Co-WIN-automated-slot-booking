
# ![icon](https://user-images.githubusercontent.com/37744870/120004844-dd42cc80-bff4-11eb-8a07-6c4da10d6a5d.png) Co-WIN automated slot booking
##### _Automatically book vaccine slots as and when they become available_

This application aims to automatically book vaccine slots for registered beneficiaries on the [Co-WIN website](https://selfregistration.cowin.gov.in/) as per availability. Users need to have an account registered on [UMANG](https://web.umang.gov.in/web_new/register) with the same phone number that is registered with Co-WIN and enable the 4-digit MPIN login process. Options for vaccine registration are obtained beforehand and a booking is attempted once a slot becomes available. No manual intervention (OTP or captcha) from the user is needed (OTPs are generated automatically every 12 minutes).

## Setup
> The setup procedure is demonstrated for Google Chrome.
> A similar procedure should be followed for other webkit browsers as well.

Users should manually login to the Co-Win website at least once so that one OTP from the same is stored on their phone.  The application automatically sends out further requests for OTPs every 12 minutes. To automatically capture the OTPs received on the phone in the browser, Google Messages is used along with a browser extension. 

 1. Make sure [Google Messages](https://play.google.com/store/apps/details?id=com.google.android.apps.messaging) is installed and selected as the default SMS app on your phone.
 
 2. Visit [Google Messages Web](https://messages.google.com/web/) on your browser and login by scanning the QR code from your phone. Make sure you select **Remember this computer** while logging in. *On your phone, enable background sync for the Messages app. If configured for the first time, a user prompt asks if you want the app to keep running in the background - select **Yes** in that case. This will ensure that you are kept logged in for subsequent sessions.* Close the tab once you have been logged in.

 ![1](https://user-images.githubusercontent.com/37744870/120005519-87225900-bff5-11eb-9c99-9ea069db2f9f.png)
 
 3. Download the file [Google Messages vaccine extension](https://github.com/rayarindam2111/Co-WIN-automated-slot-booking/raw/UMANG/Google-Message-Extension/Google-Message-Extension.zip) and extract it in a directory. The location of this directory cannot change once it has been set up.
 > This is dev version of the extension and needs to be set up manually; porting to the extension store is a work in progress.
 
 4. Open Google Chrome. Navigate to  **More Tools > Extensions**.

 ![2](https://user-images.githubusercontent.com/37744870/119220367-d48b5b80-bb07-11eb-8d95-86847a783b77.png)
 
 5. Click on  **Developer Mode**.
 
 ![3](https://user-images.githubusercontent.com/37744870/119220369-d523f200-bb07-11eb-8752-90c67b2b15c3.png)
 
 6. Click on  **Load Unpacked**.

 ![4](https://user-images.githubusercontent.com/37744870/119220370-d5bc8880-bb07-11eb-8e46-5cec5d5a654b.png)
 
 7. Browse to the directory where you extracted the files and click on  **Select Folder**. Make sure you go inside the  **Google-Message-Extension**  directory.

 ![5](https://user-images.githubusercontent.com/37744870/120007682-cc478a80-bff7-11eb-81b1-26a0a1662102.png)
 
 8. The extension should show up on the Extensions page.

 ![6](https://user-images.githubusercontent.com/37744870/120007689-cd78b780-bff7-11eb-91d1-bb0f2d2fc3be.png)
 
 9. Visit [autoslot.herokuapp.com](https://autoslot.herokuapp.com/) and click on **Connect to Google Messages**.

 ![7](https://user-images.githubusercontent.com/37744870/120007690-ce114e00-bff7-11eb-94c1-06cadcd9200a.png)
 
 10. A new tab opens up. Wait until the indicator on the top-left of the screen turns **green**. *Do not manually click anywhere on the window, or refresh/close this tab. Doing any of these would result in you failing to log in to the system.*

 ![8](https://user-images.githubusercontent.com/37744870/120104643-1739dd00-c173-11eb-8784-98ad7144d73d.png)
 
 11. Go back to the Automated vaccine slot booking page and login using your UMANG phone number and MPIN.

 ![9](https://user-images.githubusercontent.com/37744870/120007696-cf427b00-bff7-11eb-9cb0-0350cc01a8a8.png)
 
 12. Select your vaccine preferences and click on Start. A vaccine booking will be automatically made once a slot becomes available.
 
 ![10](https://user-images.githubusercontent.com/37744870/120007699-cfdb1180-bff7-11eb-88a7-2d7f243e2b1c.png)

## License
GNU General Public License v3.0