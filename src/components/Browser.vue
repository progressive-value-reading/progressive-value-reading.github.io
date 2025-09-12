<template>
  <div id="browser">
    <div id="webHead">
      <h2>
        X-Scanning Corpus
      </h2>
    </div>
    <div id="filterMenu">
      <p>Case Filters</p>
      <transition name="button-fade">
        <button @click="clearAllFilter" class="clear-filter-button">Clear All Filters</button>
      </transition>
      <div v-for="(values, category) in uniqueValues" :key="category" class="buttons"
        :style="{ borderLeft: `5px solid ${categoryDisplayInfo[category][1]}` }">
        <p class="select-title">
          {{ categoryDisplayInfo[category][0] }}
          <transition name="button-fade">
            <button @click="clearFilter(category)" class="clear-filter-button">Clear filter</button>
          </transition>
        </p>
        <button v-for="value in values" :key="value" :class="{ selected: isSelected(category, value) }"
          @click="toggleFilter(category, value)">
          {{ value }}
        </button>
      </div>
    </div>
    <div id="case-container">
      <div v-if="filteredCases.length > 0">
        <div v-for="(caseItem, index) in filteredCases" :key="index">
          <div v-if="caseItem.IsMarkScan" class="case-item row">
            <div class="case-info">
              <h4>{{ caseItem.Title }}</h4>
              <p>
                <a v-if="caseItem.CaseURL" target="_blank" :href="caseItem.CaseURL">Case URL</a>
              </p>
              <p v-if="caseItem.ShortDes">
                {{ caseItem.ShortDes }}
              </p>
              <img v-if="caseItem.Image" style="max-width: 100%; max-height: 500px;"
                :src="`images/${caseItem.Image}.png`">
            </div>
            <!-- tags -->
            <div class="case-tags">
              <div v-for="(categoryInfo, category) in categoryDisplayInfo" :key="category" class="tag"
                :style="{ borderLeft: `5px solid ${categoryInfo[1]}` }">
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
import { reactive, computed } from "vue";
import Papa from "papaparse";  // Import PapaParse

export default {
  name: "Browser",
  data() {
    return {
      categoryDisplayInfo: {
        Display: ["Display", "#F9468C"],
        Locomotion: ["Locomotion", "#F80F19"],
        BodyMovement: ["Body Movement", "#FF8000"],
        MarkType: ["Mark Types", "#F3D027"],
        EncodingChannel: ["Encoding Channel", "#23BF0C"],
        MovingSubjects: ["Moving Subjects", "#5A922D"],
        ProgressReview: ["Progress Review", "#B7DE55"],
        LocusofControl: ["Locus of Control", "#8AD2F1"],
        SkippingTool: ["Skipping Tool", "#32BFF2"],
        Anchor: ["Anchor", "#00BEB9"]
      },
      cases: [], // Holds the processed data
      filters: reactive({}), // Use reactive for managing filters
    };
  },
  computed: {
    // Extract unique values for each column to create filter buttons
    uniqueValues() {
      const columns = [
        "Display",
        "Locomotion",
        "MarkType",
        "EncodingChannel",
        "BodyMovement",
        "Locomotion",
        "MovingSubjects",
        "ProgressReview",
        "LocusofControl",
        "SkippingTool",
        "Anchor"
      ];
      const uniqueValues = {};
      columns.forEach((column) => {
        const values = this.cases.flatMap((caseItem) =>
          caseItem[column] ? caseItem[column].split(",").map((v) => v.trim()) : []
        );
        uniqueValues[column] = [...new Set(values)]; // Ensure uniqueness
      });
      return uniqueValues;
    },
    // Compute filtered cases based on selected filters
    filteredCases() {
      return this.cases.filter((caseItem) => {
        return Object.keys(this.filters).every((column) => {
          const selectedValues = this.filters[column] || [];
          if (selectedValues.length === 0) return true; // if this.fitlers[column] is empty, no case would be fiterred based on selections in this column
          const caseValues = caseItem[column]
            ? caseItem[column].split(",").map((v) => v.trim())
            : [];
          return caseValues.some((value) => selectedValues.includes(value));
        });
      });
    },
  },
  methods: {
    // Check if a value is selected for a column
    isSelected(column, value) {
      return this.filters[column]?.includes(value) || false;
    },
    // Toggle a filter value
    toggleFilter(column, value) {
      if (!this.filters[column]) {
        this.filters[column] = []; // Initialize the column array if undefined
      }
      const index = this.filters[column].indexOf(value);
      if (index > -1) {
        this.filters[column].splice(index, 1); // Remove the value
      } else {
        this.filters[column].push(value); // Add the value
      }
    },
    // Clear filters
    clearFilter(column) {
      if (!this.filters[column]) {
        this.filters[column] = []; // Initialize the column array if undefined
      }
      this.filters[column] = [];
      //this.filters[column] = [...this.uniqueValues[column]];
    },
    // Clear all filters
    clearAllFilter() {
      for (let column in this.filters) {
        this.filters[column] = []; // Empty the array for each column
      }
    },
    // Function to load and parse the CSV file
    async loadCsv() {
      try {
        const response = await fetch("/data.csv"); // Ensure your CSV file is in the public folder
        const text = await response.text();

        Papa.parse(text, {
          header: true, // The first row contains headers
          skipEmptyLines: true, // Skip empty lines
          complete: (result) => {
            // Now we have the parsed data in `result.data`
            this.cases = result.data;
            console.log("Loaded and parsed CSV data:", this.cases);
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
  async created() {
    // Load and process the CSV file when the component is created
    await this.loadCsv();
  },
};
</script>

<style scoped>
/* position website head */

#webHead {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1030;
  width: 100%;
  height: 80px;
  background-color: white; /* Make background transparent */
  padding: 20px;
  color: #333;
}

/* position selection menu */
#filterMenu {
  position: fixed;
  top: 80px;
  left: 0;
  z-index: 1030;
  width: 30%;
  height: 100%;
  padding-left: 20px;
  padding-top: 20px;
  padding-bottom: 100px;
  overflow-y: auto;
}

/* position case containers */
#browser {
  font-family: Arial, sans-serif;
  margin-top: 80px;
  margin-left: 30%;
  margin-right: 20px;
  padding-top: 20px;
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
  padding: 10px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
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
</style>
