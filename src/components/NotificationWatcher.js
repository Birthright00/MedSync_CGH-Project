import React, { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const NotificationWatcher = () => {
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const [availabilityRes, changeReqRes] = await Promise.all([
          axios.get("http://localhost:3001/api/scheduling/availability-notifications"),
          axios.get("http://localhost:3001/api/scheduling/change_request"),
        ]);

        if (availabilityRes.data.length > 0 || changeReqRes.data.length > 0) {
          toast.info("You have notifications!", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }

      } catch (err) {
        console.error("❌ Failed to check notifications:", err);
      }
    };

    checkNotifications();

  }, []);  // Only once when app loads

  return null;
};

export default NotificationWatcher;
