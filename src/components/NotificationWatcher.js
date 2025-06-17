import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_BASE_URL from '../apiConfig';

const NotificationWatcher = () => {
  const [lastSeenCount, setLastSeenCount] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found for notifications");
          return;
        }

        const [availabilityRes, changeReqRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/scheduling/availability-notifications`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/scheduling/change_request`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);

        const totalCount = availabilityRes.data.length + changeReqRes.data.length;

        if (totalCount > lastSeenCount) {
          toast.info("You have notifications!", {
            toastId: 'notifications',
            position: "top-right",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });

          setLastSeenCount(totalCount);
        }

      } catch (err) {
        console.error("❌ Failed to check notifications:", err);
      }
    };

    checkNotifications();  // run immediately
    const intervalId = setInterval(checkNotifications, 5000);
    return () => clearInterval(intervalId);
  }, [lastSeenCount]);

  return null;
};

export default NotificationWatcher;
