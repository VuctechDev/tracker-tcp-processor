const a = async () => {
  const r = await fetch("http://localhost:2302/auth/start-session", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ code: "WFPETRAF" }),
  });

  const d = await r.json();
  console.log(d);
};

// a();
