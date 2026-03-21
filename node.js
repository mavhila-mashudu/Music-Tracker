const DEFAULT_TRACKS = [
    { title: "Blinding Lights", artist: "The Weeknd", year: 2019 },
    { title: "Levitating", artist: "Dua Lipa", year: 2020 },
    { title: "Bad Guy", artist: "Billie Eilish", year: 2019 },
    { title: "As It Was", artist: "Harry Styles", year: 2022 },
    { title: "Golden", artist: "Jill Scott", year: 2004 },
    { title: "Hello", artist: "Adele", year: 2015 },
    { title: "Shape of You", artist: "Ed Sheeran", year: 2017 },
    { title: "Viva La Vida", artist: "Coldplay", year: 2008 },
    { title: "Numb", artist: "Linkin Park", year: 2003 },
    { title: "Cruel Summer", artist: "Taylor Swift", year: 2019 }
];

const STORAGE_KEY = "music-tracker-app-tracks";

// This keeps the provided grouping logic intact while modernizing the syntax.
function getMusicTitlesByYear(trackList) {
    const result = {};

    if (!trackList || trackList.length === 0) {
        return result;
    }

    for (const track of trackList) {
        if (!track || typeof track.title !== "string" || typeof track.year !== "number") {
            continue;
        }

        const year = track.year;
        const title = track.title;

        if (result[year]) {
            result[year].push(title);
        } else {
            result[year] = [title];
        }
    }

    for (const year in result) {
        result[year].sort();
    }

    return result;
}

// This follows the filtering and decade transformation rules from the starter file.
function filterAndTransformTracks(trackList, criteria = {}) {
    const result = [];

    if (!trackList || trackList.length === 0) {
        return result;
    }

    const minYear = criteria.minYear;
    const maxYear = criteria.maxYear;
    const artistFilter = criteria.artist ? criteria.artist.toLowerCase() : null;

    for (const track of trackList) {
        if (
            !track ||
            typeof track.title !== "string" ||
            typeof track.artist !== "string" ||
            typeof track.year !== "number"
        ) {
            continue;
        }

        const year = track.year;
        const artist = track.artist;

        if (typeof minYear === "number" && year < minYear) {
            continue;
        }
        if (typeof maxYear === "number" && year > maxYear) {
            continue;
        }
        if (artistFilter && artist.toLowerCase() !== artistFilter) {
            continue;
        }

        const decade = Math.floor(year / 10) * 10 + "s";

        result.push({
            title: track.title,
            artist: track.artist,
            year: track.year,
            decade: decade
        });
    }

    return result;
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

if (typeof document !== "undefined") {
    const minYearInput = document.getElementById("min-year");
    const maxYearInput = document.getElementById("max-year");
    const artistInput = document.getElementById("artist-filter");
    const filterButton = document.getElementById("filter-btn");
    const groupButton = document.getElementById("group-btn");
    const resetButton = document.getElementById("reset-btn");
    const resultsContainer = document.getElementById("results");
    const resultSummary = document.getElementById("result-summary");
    const viewBadge = document.getElementById("view-badge");
    const addTrackForm = document.getElementById("add-track-form");

    let tracks = loadTracks();

    function loadTracks() {
        try {
            const savedTracks = localStorage.getItem(STORAGE_KEY);

            if (!savedTracks) {
                return [...DEFAULT_TRACKS];
            }

            const parsedTracks = JSON.parse(savedTracks);

            if (!Array.isArray(parsedTracks)) {
                return [...DEFAULT_TRACKS];
            }

            return parsedTracks.filter((track) => (
                track &&
                typeof track.title === "string" &&
                typeof track.artist === "string" &&
                typeof track.year === "number"
            ));
        } catch (error) {
            return [...DEFAULT_TRACKS];
        }
    }

    function saveTracks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    }

    function createTrackCard(track) {
        return `
            <article class="track-card">
                <h3>${escapeHtml(track.title)}</h3>
                <p class="track-meta"><strong>Artist:</strong> ${escapeHtml(track.artist)}</p>
                <p class="track-meta"><strong>Year:</strong> ${track.year}</p>
                <span class="track-pill">Decade: ${track.decade}</span>
            </article>
        `;
    }

    function renderTrackCards(trackList, summaryText, badgeText) {
        if (!trackList.length) {
            renderEmptyState("No tracks matched your filter.", "Try widening the year range or clearing the artist filter.");
            updateResultHeader(summaryText, badgeText);
            return;
        }

        resultsContainer.className = "results-grid";
        resultsContainer.innerHTML = trackList
            .slice()
            .sort((first, second) => first.title.localeCompare(second.title))
            .map(createTrackCard)
            .join("");

        updateResultHeader(summaryText, badgeText);
    }

    function renderGroupedResults(groupedTitles, originalTracks) {
        const years = Object.keys(groupedTitles).sort((first, second) => Number(second) - Number(first));

        if (!years.length) {
            renderEmptyState("There are no tracks to group yet.", "Add a new track to start building your collection.");
            updateResultHeader("No grouped tracks available.", "Grouped");
            return;
        }

        const groupedMarkup = years.map((year) => {
            const titles = groupedTitles[year];
            const availableTracks = originalTracks
                .filter((track) => track.year === Number(year))
                .map((track) => ({
                    ...track,
                    decade: Math.floor(track.year / 10) * 10 + "s"
                }));

            const items = titles.map((title) => {
                const matchingTrackIndex = availableTracks.findIndex((track) => track.title === title);

                if (matchingTrackIndex === -1) {
                    return "";
                }

                const [track] = availableTracks.splice(matchingTrackIndex, 1);

                return `
                    <li>
                        <strong>${escapeHtml(track.title)}</strong><br>
                        <span class="track-meta">${escapeHtml(track.artist)} | ${track.year} | ${track.decade}</span>
                    </li>
                `;
            }).join("");

            return `
                <section class="group-card">
                    <h3>${year}</h3>
                    <ul class="group-list">${items}</ul>
                </section>
            `;
        }).join("");

        resultsContainer.className = "grouped-results";
        resultsContainer.innerHTML = groupedMarkup;
        updateResultHeader(`Grouped ${originalTracks.length} track${originalTracks.length === 1 ? "" : "s"} by year.`, "Grouped");
    }

    function renderEmptyState(title, message) {
        resultsContainer.className = "results-grid";
        resultsContainer.innerHTML = `
            <article class="empty-state">
                <h3>${title}</h3>
                <p>${message}</p>
            </article>
        `;
    }

    function updateResultHeader(summaryText, badgeText) {
        resultSummary.textContent = summaryText;
        viewBadge.textContent = badgeText;
    }

    function getCriteriaFromInputs() {
        const minYearValue = minYearInput.value.trim();
        const maxYearValue = maxYearInput.value.trim();
        const artistValue = artistInput.value.trim();

        return {
            minYear: minYearValue ? Number(minYearValue) : undefined,
            maxYear: maxYearValue ? Number(maxYearValue) : undefined,
            artist: artistValue || undefined
        };
    }

    function renderAllTracks() {
        const transformedTracks = filterAndTransformTracks(tracks, {});
        renderTrackCards(
            transformedTracks,
            `Showing all ${transformedTracks.length} track${transformedTracks.length === 1 ? "" : "s"}.`,
            "All Tracks"
        );
    }

    function handleFilterTracks() {
        const criteria = getCriteriaFromInputs();

        if (
            typeof criteria.minYear === "number" &&
            typeof criteria.maxYear === "number" &&
            criteria.minYear > criteria.maxYear
        ) {
            renderEmptyState("Invalid year range.", "Make sure the minimum year is less than or equal to the maximum year.");
            updateResultHeader("The filter could not be applied.", "Filter Error");
            return;
        }

        const filteredTracks = filterAndTransformTracks(tracks, criteria);
        renderTrackCards(
            filteredTracks,
            `Found ${filteredTracks.length} track${filteredTracks.length === 1 ? "" : "s"} using your filter settings.`,
            "Filtered"
        );
    }

    function handleGroupTracks() {
        const groupedTitles = getMusicTitlesByYear(tracks);
        renderGroupedResults(groupedTitles, tracks);
    }

    function resetFilters() {
        minYearInput.value = "";
        maxYearInput.value = "";
        artistInput.value = "";
        renderAllTracks();
    }

    function handleAddTrack(event) {
        event.preventDefault();

        const titleField = document.getElementById("track-title");
        const artistField = document.getElementById("track-artist");
        const yearField = document.getElementById("track-year");

        const title = titleField.value.trim();
        const artist = artistField.value.trim();
        const yearValue = yearField.value.trim();
        const year = Number(yearValue);

        if (!title || !artist || !yearValue || Number.isNaN(year)) {
            return;
        }

        tracks.push({ title, artist, year });
        saveTracks();
        addTrackForm.reset();
        renderAllTracks();
        updateResultHeader(`Added "${title}" and refreshed the track list.`, "Updated");
    }

    filterButton.addEventListener("click", handleFilterTracks);
    groupButton.addEventListener("click", handleGroupTracks);
    resetButton.addEventListener("click", resetFilters);
    addTrackForm.addEventListener("submit", handleAddTrack);

    renderAllTracks();
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        getMusicTitlesByYear: getMusicTitlesByYear,
        filterAndTransformTracks: filterAndTransformTracks
    };
}
