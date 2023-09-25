document.addEventListener("DOMContentLoaded", function () {
	const fileInput = document.getElementById("fileInput");

	fileInput.addEventListener("change", (e) => {
		e.preventDefault();
		const fileInput = document.getElementById("fileInput");
		const file = fileInput.files[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const fileContent = event.target.result;
				const channelNames = fileContent.split("\n");
				for (let i = 0; i < channelNames.length; i++) {
					channelNames[i] = channelNames[i].trim();
				}

				// Update the channel list in the popup
				updateChannelList(channelNames);
			};
			reader.readAsText(file);
		}
	});
});
// Function to update the channel list in the popup
function updateChannelList(channelArray) {
	// Clear the channel list first
	const channelList = document.getElementById("channelList");
	channelList.innerHTML = "";

	// Iterate over the channel names and create list items for each
	channelArray.forEach((channelName) => {
		if (channelName !== "") {
			const li = document.createElement("li");
			li.textContent = channelName;

			// Create a delete button for each channel
			const deleteButton = document.createElement("button");
			deleteButton.textContent = "Delete";
			deleteButton.addEventListener("click", () => {
				// Remove the channel name from the array
				const index = channelArray.indexOf(channelName);
				if (index !== -1) {
					channelArray.splice(index, 1);
					// Update the channel list after deleting
					updateChannelList(channelArray);
				}
			});

			li.appendChild(deleteButton);
			channelList.appendChild(li);
		}
	});

	// Update the storage with the modified array
	chrome.storage.sync.set({ textData: channelArray });
}

// Create an input box to add single channel names
const inputBox = document.getElementById("addChannelName");
inputBox.addEventListener("keydown", (event) => {
	if (event.key === "Enter" && inputBox.value.trim() !== "") {
		// Load the channel list from storage on popup open
		chrome.storage.sync.get("textData", (data) => {
			const channelArray = data.textData || []; // Default to an empty array if data.textData is undefined
			// Add the channel name to the array
			channelArray.push(inputBox.value.trim());

			// Update the channel list after adding
			updateChannelList(channelArray);
			inputBox.value = ""; // Clear the input box
		});
	}
});

// Create a "Delete All" button
const deleteAllButton = document.getElementById("deleteAll");
deleteAllButton.addEventListener("click", () => {
	updateChannelList([]);
});

// Load the channel list from storage on popup open
chrome.storage.sync.get("textData", (data) => {
	const channelArray = data.textData || []; // Default to an empty array if data.textData is undefined

	// Update the channel list in the popup
	updateChannelList(channelArray);
});
