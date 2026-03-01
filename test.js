async function testLiveServer() {
  const cloudRunUrl = "https://elysianclaimssimilarity-488463719336.europe-west1.run.app/search";

  console.log(`Sending search request to: ${cloudRunUrl}...\n`);

  try {
    const response = await fetch(cloudRunUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: "Looking for examples of water damage caused by old plumbing or pipes bursting." 
      })
    });

    const data = await response.json();
    console.log("Server Response:");
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error("Test failed to reach server:", error);
  }
}

testLiveServer();