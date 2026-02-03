<template>
  <div id="browser">
    <!-- (4) Placeholder anchor so native hash jump isn't lost on first load -->
    <div
      v-if="initialHashId"
      :id="initialHashId"
      class="anchor-placeholder"
      aria-hidden="true"
    ></div>

    <div id="webHead">
      <h2>Progressive Value Reading Corpus</h2>
    </div>

    <div id="filterMenu">
      <p>Case Filters</p>
      <transition name="button-fade">
        <button @click="clearAllFilter" class="clear-filter-button">Clear All Filters</button>
      </transition>

      <div
        v-for="(values, category) in uniqueValues"
        :key="category"
        class="buttons"
        :style="{ borderLeft: `5px solid ${categoryDisplayInfo[category][1]}` }"
      >
        <p class="select-title">
          {{ categoryDisplayInfo[category][0] }}
          <transition name="button-fade">
            <button @click="clearFilter(category)" class="clear-filter-button">Clear filter</button>
          </transition>
        </p>
        <button
          v-for="value in values"
          :key="value"
          :class="{ selected: isSelected(category, value) }"
          @click="toggleFilter(category, value)"
        >
          {{ value }}
        </button>
      </div>
    </div>

    <div id="case-container">
      <div v-if="filteredCases.length > 0">
        <div v-for="(caseItem, index) in filteredCases" :key="index">
          <div class="case-item row">
            <!-- ensure the real anchors match the IDs -->
            <div class="case-info anchor-target" :id="String(caseItem.ID)">
              <h4>Case {{ caseItem.ID }}: {{ caseItem.Title }}</h4>
              <p>
                <a v-if="caseItem.Link" target="_blank" :href="caseItem.Link">Link to source</a>
              </p>

              <p v-if="caseItem.Brief_Description">
                {{ caseItem.Brief_Description }}
              </p>
              <img
                v-if="caseItem.Image"
                style="max-width: 100%; max-height: 500px;"
                :src="`images/${caseItem.Image}.png`"
              >
            </div>

            <!-- tags -->
            <div class="case-tags">
              <div
                v-for="(categoryInfo, category) in categoryDisplayInfo"
                :key="category"
                class="tag"
                :style="{ borderTop: `5px solid ${categoryInfo[1]}` }"
              >
                <div class="tag-name">{{ categoryInfo[0] }}</div>
                <div class="tag-value">{{ caseItem[category] }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-else>No cases match the selected filters.</p>
    </div>
  </div>
</template>

<script>
import { reactive, computed, nextTick } from "vue";
import Papa from "papaparse";

export default {
  name: "Browser",
  data() {
    return {
      categoryDisplayInfo: {
        Display: ["Display", "#FFD0A0"],
        Spatial_Channel: ["Spatial Channel", "#FFD0A0"],
        Visceral_Channel: ["Visceral Channel", "#FFD0A0"],
        Viewer_Locomotion_Mode: ["Viewer Locomotion Mode", "#60ABD1"],
        Object_Moving_Mode: ["Object Moving Mode", "#60ABD1"],
        Body_Movement: ["Body Movement", "#60ABD1"],
        Progress_Review: ["Progress Review", "#DE8DAF"],
        Anchor_Representation: ["Anchor (Representation)", "#DE8DAF"],
        Anchor_Space: ["Anchor (Space)", "#DE8DAF"],
        Narrative: ["Narrative", "#DE8DAF"],
        General_Startegies: ["General Startegies", "#00BEB9"]
      },
      cases: [],
      filters: reactive({}),
      // (4) capture the initial hash (so the placeholder can exist at first paint)
      initialHashId: null,
    };
  },
  computed: {
    uniqueValues() {
      const columns = [
        "Display",
        "Spatial_Channel",
        "Visceral_Channel",
        "Viewer_Locomotion_Mode",
        "Object_Moving_Mode",
        "Body_Movement",
        "Progress_Review",
        "Anchor_Representation",
        "Anchor_Space",
        "Narrative",
        "General_Startegies"
      ];
      const uniqueValues = {};
      columns.forEach((column) => {
        const values = this.cases.flatMap((caseItem) =>
          caseItem[column] ? caseItem[column].split(",").map((v) => v.trim()) : []
        );
        uniqueValues[column] = [...new Set(values)];
      });
      return uniqueValues;
    },
    filteredCases() {
      return this.cases.filter((caseItem) => {
        return Object.keys(this.filters).every((column) => {
          const selectedValues = this.filters[column] || [];
          if (selectedValues.length === 0) return true;
          const caseValues = caseItem[column]
            ? caseItem[column].split(",").map((v) => v.trim())
            : [];
          return caseValues.some((value) => selectedValues.includes(value));
        });
      });
    },
  },
  methods: {
    isSelected(column, value) {
      return this.filters[column]?.includes(value) || false;
    },
    toggleFilter(column, value) {
      if (!this.filters[column]) this.filters[column] = [];
      const index = this.filters[column].indexOf(value);
      if (index > -1) this.filters[column].splice(index, 1);
      else this.filters[column].push(value);
    },
    clearFilter(column) {
      if (!this.filters[column]) this.filters[column] = [];
      this.filters[column] = [];
    },
    clearAllFilter() {
      for (let column in this.filters) this.filters[column] = [];
    },

    // --- Helper: get current hash id, handling %23 and decoding ---
    getHashId() {
      if (!window || !window.location || !location.hash) return "";
      let hash = location.hash;
      if (hash.startsWith("%23")) {
        hash = "#" + decodeURIComponent(hash).replace(/^#/, "");
      }
      return decodeURIComponent(hash.slice(1));
    },

    // --- (1) Robust manual scroll AFTER render (with retries) ---
    scrollToHash(retries = 20) {
      const id = this.getHashId();
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        // Use scroll-margin-top via CSS to avoid fixed header overlap
        el.scrollIntoView();
        return;
      }
      if (retries > 0) {
        setTimeout(() => this.scrollToHash(retries - 1), 100);
      }
    },

    async loadCsv() {
      try {
        const response = await fetch("/Case_Coding_Final.csv");
        const text = await response.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: async (result) => {
            this.cases = result.data;
            // Wait for DOM to reflect new cases, then correct the scroll
            await nextTick();
            this.scrollToHash();
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
          }
        });
      } catch (err) {
        console.error("Failed to load the CSV file:", err);
      }
    },
  },

  created() {
    // (4) set up the placeholder anchor id as early as possible
    const id = this.getHashId();
    this.initialHashId = id || null;
  },

  async mounted() {
    // Try once on mount (helps when assets are cached)
    this.scrollToHash();
    // Keep reacting to in-page hash changes
    window.addEventListener("hashchange", this.scrollToHash);
  },

  beforeUnmount() {
    window.removeEventListener("hashchange", this.scrollToHash);
  },

  async created() {
    // Load and process the CSV file when the component is created
    await this.loadCsv();
  },
};
</script>

<style>
/* Smoothen UX for in-page jumps (optional; remove if you want instant jumps) */
html { scroll-behavior: smooth; }

/* Keep anchors from hiding under a fixed header (adjust 80px as needed) */
.anchor-target { scroll-margin-top: 80px; }

/* (4) The tiny placeholder landed by the browser's first, native hash jump */
.anchor-placeholder {
  position: absolute;
  top: 0; left: 0;
  width: 1px; height: 1px;
  overflow: hidden;
}
</style>


<style scoped>
/* position website head */
#webHead {
  position: sticky;
  top: 0;
  left: 0;
  padding: 20px;
  z-index: 1030;
  width: 100%;
  height: 70px;
  background-color: white; /* Make background transparent */
  color: #333;
  box-shadow: 0 2px 4px -1px rgba(0,0,0,.2),0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12);
  background-color:#f5f5f5
}

/* position selection menu */
#filterMenu {
  position: fixed;
  top: 75px;
  left: 0;
  z-index: 1030;
  width: 350px;
  height: calc(100vh - 75px);
  padding-left: 20px;
  padding-top: 20px;
  overflow-y: scroll;
}

/* position case containers */
#browser {
  font-family: Arial, sans-serif;
}

#case-container{
  margin-left: 350px;
  padding-top: 30px;
  text-align: center;
}


/* styles of selection menu and buttons */
.buttons {
  padding-left:5px;
  margin-bottom: 10px;
  border-radius: 4px;
  text-align: left;
}

button {
  padding: 5px 5px;
  border: 1px solid #ccc;
  background-color: white;
  color: black;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.8rem;
}

button.selected {
  background-color: #3a99d5;
  color: white;
}

.case-item {
  width: 100%;
  max-width: 1100px;
  padding: 10px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  margin-left: auto;
  margin-right: auto;
}

/* Transition effects */
.button-fade-enter-active,
.button-fade-leave-active {
  transition: opacity 0.5s ease;
}

.button-fade-enter,
.button-fade-leave-to {
  opacity: 0;
}

/* Common styles for all clear filter buttons */
.clear-filter-button {
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.3s ease, background-color 0.3s ease;
}

/* Hover effect for buttons */
.clear-filter-button:hover {
  background-color: #3a99d5;
  color: white;
  transform: scale(1.1);
}

/* Active effect when the button is clicked */
.clear-filter-button:active {
  transform: scale(0.9);
}

/* Container for the tags */
.case-tags {
  display: flex;
  flex-direction: row;
  padding: 10px;
}

/* Each tag */
.tag {
  /* display: flex;
  flex-direction: column; */
  margin-top: 5px;
  padding: 10px;
  background-color: #fff;
  border-radius: 5px;
  font-size: 0.8rem;
  width: 150px;
  /* Adjust as necessary */
}

/* Tag name styling (column name) */
.tag-name {
  font-size: 0.5rem;
  color: #555;
  margin-bottom: 2px;
}

/* Tag value styling (real value) */
.tag-value {
  font-size: 0.8rem;
  color: #333;
}

/* Style for the left border of the tag */
.tag {
  border-left: 5px solid transparent;
  /* Initially transparent, color applied dynamically */
}

/* Scroll bar of filter menu*/
#filterMenu::-webkit-scrollbar-track {
    background: transparent;
}
</style>
