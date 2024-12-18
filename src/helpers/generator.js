import axios from 'axios';

import dotenv from 'dotenv'
dotenv.config();

const generateId = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const generateVerifyEmailHTML = (name, verify_link) => {

    let html = `<body style="background-color: #e9ecef;">

    <!-- start preheader -->
    <div class="preheader" style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
      A preheader is the short summary text that follows the subject line when an email is viewed in the inbox.
    </div>
    <!-- end preheader -->

    <!-- start body -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <!-- start hero -->
      <tr>
        <td align="center" bgcolor="#e9ecef">
          <!--[if (gte mso 9)|(IE)]>
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
          <tr>
          <td align="center" valign="top" width="600">
          <![endif]-->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
            <tr>
              <td align="left" bgcolor="#ffffff" style="padding: 36px 24px 0; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; border-top: 3px solid #d4dadf;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;">Hi ${name}, Konfirmasi Alamat Email Anda</h1>
              </td>
            </tr>
          </table>
          <!--[if (gte mso 9)|(IE)]>
          </td>
          </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
      <!-- end hero -->

      <!-- start copy block -->
      <tr>
        <td align="center" bgcolor="#e9ecef">
          <!--[if (gte mso 9)|(IE)]>
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
          <tr>
          <td align="center" valign="top" width="600">
          <![endif]-->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">

            <!-- start copy -->
            <tr>
              <td align="left" bgcolor="#ffffff" style="padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                <p style="margin: 0;">Klik tombol dibawah untuk melakukan konfirmasi alamat email. Jika Anda tidak membuat akun di E-Vegetables, Anda bisa menghapus email ini.</p>
              </td>
            </tr>
            <!-- end copy -->

            <!-- start button -->
            <tr>
              <td align="left" bgcolor="#ffffff">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" bgcolor="#ffffff" style="padding: 12px;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" bgcolor="#1a82e2" style="border-radius: 6px;">
                            <a href="${verify_link}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px;">Tekan untuk Verifikasi</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- end button -->

            <!-- start copy -->
            <tr>
              <td align="left" bgcolor="#ffffff" style="padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                <p style="margin: 0;">Jika tombol tidak bekerja, klik link dibawah ini untuk melakukan verifikasi:</p>
                <p style="margin: 0;"><a href="${verify_link}" target="_blank">Klik disini!</a></p>
              </td>
            </tr>
            <!-- end copy -->

          </table>
          <!--[if (gte mso 9)|(IE)]>
          </td>
          </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
      <!-- end copy block -->
    </table>
    <!-- end body -->

  </body>`;

  return html;
}

const calculateDeliveryFee = (distanceKm) => {
  const baseFee = 12000; // Base fee for up to 1 km
  const additionalFeePer2Km = 3000; // Additional fee for every 2 km

  // Calculate additional fee based on distance
  const additionalIntervals = Math.max(0, Math.floor((distanceKm - 1) / 2));
  return baseFee + (additionalFeePer2Km * additionalIntervals);
};

const sendNotificationToUser = async (user_id, title, content) => {
  let payload =  {
    "app_id": process.env.NOTIFICATION_APP_ID,
    "include_aliases":{
        "external_id":[user_id]
    },
    "target_channel":"push",
    "headings":{
      "en":title
    },
    "contents": {
      "en": content
    }
  }

  try {
    const response = await axios.post('https://onesignal.com/api/v1/notifications', payload, {
      headers: {
        Authorization: process.env.NOTIFICATION_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    console.log('Response Data:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

export default {
  generateId,
  generateVerifyEmailHTML,
  calculateDeliveryFee,
  sendNotificationToUser,
}