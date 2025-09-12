<template>
    <div class="browser">
      <h1>Case Filtering Website</h1>
      <div class="filters">
        <div v-for="(values, column) in uniqueValues" :key="column" class="filter-group">
          <h2>{{ column }}</h2>
          <div class="buttons">
            <button
              v-for="value in values"
              :key="value"
              :class="{ selected: isSelected(column, value) }"
              @click="toggleFilter(column, value)"
            >
              {{ value }}
            </button>
          </div>
        </div>
      </div>
  
      <div class="cases">
        <h2>Filtered Cases</h2>
        <div v-if="filteredCases.length > 0">
          <pre v-for="(caseItem, index) in filteredCases" :key="index" class="case-item">
            {{ caseItem }}
          </pre>
        </div>
        <p v-else>No cases match the selected filters.</p>
      </div>
    </div>
  </template>
  
  <script>
  import { reactive, computed } from "vue";
  import { processExcelFile } from "@/utils/processData";
  
  export default {
    name: "Browser",
    data() {
      return {
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
          "Body Movement Type",
          "Locus of control",
          "Encoding Channel",
          "Anchor",
          "Visual Mark",
          "Skipping Tool",
          "Overview",
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
      // Check if a value is selected for a column
      isSelected(column, value) {
        return this.filters[column]?.includes(value);
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
    },
    async created() {
      try {
        // Load and process the Excel file
        const processedData = await processExcelFile("/data.xlsx"); // Ensure data.xlsx is in the public folder
        this.cases = processedData;
      } catch (err) {
        console.error("Failed to load or process the data:", err);
      }
    },
  };
  </script>
  
  <style scoped>
  .browser {
    font-family: Arial, sans-serif;
    padding: 20px;
  }
  
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .filter-group {
    margin-bottom: 20px;
  }
  
  .filter-group h2 {
    margin-bottom: 10px;
  }
  
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  button {
    padding: 10px 15px;
    border: 1px solid #ccc;
    background-color: white;
    cursor: pointer;
    border-radius: 4px;
  }
  
  button.selected {
    background-color: blue;
    color: white;
  }
  
  .cases {
    margin-top: 20px;
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
  </style>
  