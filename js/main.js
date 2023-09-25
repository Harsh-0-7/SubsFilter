class NewLayout {
	async getSubbedChannels() {
		let l = await chrome.storage.sync.get("textData");
		if (!l) l = [];
		else l = l.textData;
		return l;
	}

	async hideHomepageRecommends() {
		// console.log("here");
		// youtube's new layout only shows a few subscriptions, so force the rest to show up
		if ($("div#expandable-items").children().length === 0) {
			$("#expander-item").click();
		}

		await new Promise((resolve, reject) => {
			setTimeout(function () {
				if (
					$("div#expandable-items").children().length !== 0 ||
					$("div#sections > :nth-child(2) > div#items").children().length <= 2
				) {
					resolve("");
				}
			}, 10);
		});

		let subbed_channel_names = await this.getSubbedChannels();

		// worth noting that there's more than one "ytd-two-column-browse-results-renderer" in a youtube page,
		// likely because of youtube's "never ever load a new page" philosophy,
		// so just use the one that involves homepage recommendations
		let listed_channel_elements = $(
			"ytd-two-column-browse-results-renderer[page-subtype='home']"
		).find("ytd-item-section-renderer, ytd-rich-item-renderer");
		let listed_channel_names = listed_channel_elements
			.map(function () {
				if (
					$(this).find(
						"#title-annotation > a, yt-formatted-string.ytd-channel-name > a"
					).length !== 0
				) {
					return $.trim(
						$(this)
							.find(
								"#title-annotation > a, yt-formatted-string.ytd-channel-name > a"
							)
							.eq(0)
							.text()
					);
				} else {
					return $.trim($(this).find("span#title").text());
				}
			})
			.get();

		listed_channel_names.forEach(function (name, i) {
			if (
				!subbed_channel_names.includes(name) &&
				listed_channel_elements.eq(i).css("display") !== "none"
			) {
				listed_channel_elements.eq(i).hide();
				// console.log(
				// 	"Hid channel " + name + " as it was not on the subscription list"
				// );
			} else if (
				subbed_channel_names.includes(name) &&
				listed_channel_elements.eq(i).css("display") === "none"
			) {
				listed_channel_elements.eq(i).show();
			}
		});
		// youtube changed their homepage layout recently,
		// adding a "Breaking news" section,
		// and a "Free to watch" section with movies nobody cares about
		$("ytd-rich-section-renderer").hide();
	}

	async hideRecommends() {
		// console.log("Default");

		$("#continuations > yt-next-continuation > paper-button").hide();
		const channelName = $("#upload-info a").text();
		const recommendations = $("div#related div#items div#contents > *");
		if ($("#toggle").attr("aria-pressed") === "true") {
			$("#toggle").click();
		}
		const recName = recommendations
			.eq(0)
			.find("yt-formatted-string#byline, yt-formatted-string.ytd-channel-name")
			.text();

		if (recName !== channelName) {
			recommendations.eq(0).hide();
			$(".ytp-next-button").hide();
			$("video").on("progress", () => {
				if ($("#toggle").attr("aria-pressed") === "true") $("#toggle").click();
			});
		} else recommendations.eq(0).show();
		if (
			$("ytd-playlist-panel-renderer").attr("hidden") !== "hidden" &&
			!recommendations.eq(0).is("ytd-compact-autoplay-renderer")
		)
			recommendations.eq(0).hide();
		const mixTitle = recommendations
			.eq(1)
			.find("yt-formatted-string#byline, yt-formatted-string.ytd-channel-name")
			.eq(0)
			.text();
		const vidTitle = $("h1 > yt-formatted-string").text();
		if (mixTitle === `Mix - ${vidTitle}`) recommendations.eq(1).hide();
		let i = mixTitle === `Mix - ${vidTitle}` ? 2 : 1;
		for (i; i < recommendations.length; i += 1) {
			const recName = recommendations
				.eq(i)
				.find(
					"yt-formatted-string#byline, yt-formatted-string.ytd-channel-name"
				)
				.text();
			if (recName !== channelName && recommendations.eq(i).is(":visible"))
				recommendations.eq(i).hide();
			else if (recName === channelName && recommendations.eq(i).is(":hidden"))
				recommendations.eq(i).show();
		}
		$("video").on("ended", function () {
			let recommendations = $(".ytp-endscreen-content").children("a");
			for (let i = 0; i < recommendations.length; i++) {
				let rec_name = recommendations
					.eq(i)
					.find("span.ytp-videowall-still-info-author")
					.eq(0)
					.text();
				rec_name = rec_name.split(" • ")[0];
				if (
					rec_name !== channel_name &&
					recommendations.eq(i).css("display") !== "none"
				)
					recommendations.eq(i).hide();
				else if (
					rec_name === channel_name &&
					recommendations.eq(i).css("display") === "none"
				)
					recommendations.eq(i).show();
			}
		});
		$(window).off("load");

		// Get the list of subscribed channels
		const subscribedChannels = await this.getSubbedChannels();

		// Iterate through the recommendations and hide videos from non-subscribed channels
		recommendations.each(function (index) {
			const recName = $(this)
				.find(
					"yt-formatted-string#byline, yt-formatted-string.ytd-channel-name"
				)
				.text();

			// Check if the recommendation is from a subscribed channel
			if (!subscribedChannels.includes(recName) && $(this).is(":visible")) {
				$(this).hide();
			} else if (
				subscribedChannels.includes(recName) &&
				$(this).is(":hidden")
			) {
				$(this).show();
			}
		});
	}
}

// event listener for first video load only
$(document).ready(function () {
	let new_layout = new NewLayout();

	if ($("body").attr("dir")) {
		// when you hit a "subscribe" button on a video,
		// this element recommends you a bunch of other channels
		$("#inline-recs-list-renderer").hide();
		$(document).ready(function () {
			// Check the current URL path
			switch (window.location.pathname) {
				case "/":
					new_layout.hideHomepageRecommends();
					break;
				default:
					new_layout.hideRecommends();
					break;
			}
		});
		// Variables to track scroll interval and page size
		let scrollInterval = 0;
		let pageSize = $(window).height() * 0.4; // Half of the window height

		// Function to check scroll position and call hideRecommendations
		function checkScrollPosition(isHomePage) {
			const scrollPosition = $(window).scrollTop();
			const currentPageSize = pageSize * scrollInterval;

			// Check if scrolled halfway through the current page size
			if (scrollPosition >= currentPageSize) {
				if (isHomePage) new_layout.hideHomepageRecommends();
				else new_layout.hideRecommends();

				scrollInterval++; // Increase the scroll interval
			}
		}

		$(window).scroll(function () {
			// Check the current URL path
			switch (window.location.pathname) {
				case "/":
					checkScrollPosition(true);
					break;
				default:
					checkScrollPosition(false);
					break;
			}
		});
	}
});
