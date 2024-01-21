import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import notification from "./notification.svg";
import "./App.css";

const publicKey =
  "BCRMXt1KpONBNVLwaae1F5M6rRqBB-c79xXZ_UcWufu4ZHHAWtSJuStvUSx0wl8a110vQ4HU2aZnjXuoJumuGJs";

// Function to convert a base64 string to a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const buffer = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    buffer[i] = rawData.charCodeAt(i);
  }

  return buffer;
}

function App() {
  const [socket, setSocket] = useState(null);
  const [notificationsList, setNotificationsList] = useState([]);
  const [openedNotifications, setOpenedNotifications] = useState([]);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      console.log("pushManager", navigator.serviceWorker);
      navigator.serviceWorker.ready.then((registration) => {
        console.log({ registration });
        registration.pushManager
          .subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          })
          .then((subscription) => {
            console.log({ subscription });
            // Send the subscription to the server
            fetch("https://notification-server-gpxp.onrender.com/subscribe", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(subscription),
            });
          })
          .catch((error) => {
            console.error("Error subscribing to push notifications:", error);
          });
      });
    }

    const ws = new WebSocket("wss:notification-server-gpxp.onrender.com");
    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      console.log({ event });
      setNotificationsList((list) => [...list, event?.data]);

      // Handle notification data here
    };

    return () => {
      socket.onmessage = null;
      // Cleanup WebSocket event listeners
    };
  }, [socket]);

  const handleOpenNotifications = () => {
    setOpenedNotifications([...notificationsList]);
    setNotificationsList([]);
    setTimeout(() => {
      setOpenedNotifications([]);
    }, 3000);
  };

  return (
    <div>
      <header className="header">
        <a
          className="link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={logo} className="logo" alt="logo" />
        </a>
        <div className="usernameWrapper">
          <span>Hi, Sasha</span>
          <div className="notificationWrapper">
            <img
              src={notification}
              className="notificationIcon"
              alt="notification"
            />
            {!!notificationsList.length && (
              <div
                className="notificationCount"
                onClick={handleOpenNotifications}
              >
                {notificationsList.length}
              </div>
            )}
          </div>
          {!!openedNotifications.length && (
            <div className="openedNotifications">
              {openedNotifications.map((item, index) => {
                return <div key={index}>{item}</div>;
              })}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
