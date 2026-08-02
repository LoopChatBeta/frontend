(function () {

  const clientId =
    document.currentScript.dataset.clientId;

  const button =
    document.createElement("button");

  button.innerText = "Chat";

  button.style.position = "fixed";
  button.style.bottom = "20px";
  button.style.right = "20px";
  button.style.zIndex = "999999";

  document.body.appendChild(button);

  const iframe =
    document.createElement("iframe");

  iframe.src =
    "https://frontend-three-beryl-17.vercel.app/chat"
    + "?client_id="
    + encodeURIComponent(clientId);

  iframe.style.position = "fixed";
  iframe.style.bottom = "80px";
  iframe.style.right = "20px";
  iframe.style.width = "400px";
  iframe.style.height = "600px";
  iframe.style.display = "none";
  iframe.style.zIndex = "999999";

  document.body.appendChild(iframe);

  button.onclick = () => {

    iframe.style.display =
      iframe.style.display === "none"
        ? "block"
        : "none";
  };

})();
