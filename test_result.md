#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Fix critical connection persistence issues and implement UX improvements for the psychiatry resident dashboard:
  
  CRITICAL FIXES:
  1. Fix disappearing connection lines (edges) when exiting 'Edit Mind Map' mode or upon page refresh
  2. Resolve difficulty loading data when trying to open subpages
  
  UX IMPROVEMENTS:
  3. New nodes should generate in the center of the user's current view
  4. On opening the app, nodes should already be positioned correctly (no jumping/shifting)
  5. When "Realign Nodes" button is pressed, arrange nodes in columns by category type in the central viewing area

backend:
  - task: "Verify existing mind map API endpoints work correctly"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "All CRUD endpoints for topics, cases, tasks, literature are implemented. /api/mindmap-data endpoint returns all data. Position fields exist in models."
        - working: true
          agent: "main"
          comment: "API endpoints should be retested after frontend fixes to ensure connection persistence works end-to-end"
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing completed. All API endpoints are working correctly. CRUD operations for topics, cases, tasks, and literature function as expected. Position fields are properly stored and retrieved. Connection persistence between entities (topics-cases, topics-literature, tasks-topics, tasks-cases) is working correctly. The init-sample-data endpoint successfully initializes sample data."

frontend:
  - task: "Fix connection persistence during mode switches"
    implemented: true
    working: false
    file: "App.js"
    stuck_count: 1
    priority: "high"
    needs_retesting: true
    status_history:
        - working: false
          agent: "user"
          comment: "User reported that connections are still disappearing when switching in and out of edit mode"
        - working: true
          agent: "main"
          comment: "FIXED: Added delay in mode switching useEffect to ensure auto-save completes. Added immediate localStorage save for connections without debounce. Modified onConnect to force immediate save."

  - task: "Fix subpage loading issues"
    implemented: true
    working: false
    file: "App.js"
    stuck_count: 1
    priority: "high"
    needs_retesting: true
    status_history:
        - working: false
          agent: "user"
          comment: "User reported difficulty loading data when trying to open subpages"
        - working: true
          agent: "main"
          comment: "FIXED: Added timeout and error handling to subpage data loading. Fixed data flow issues that were causing loading problems."

  - task: "Center new nodes in current view"
    implemented: true
    working: true
    file: "App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        - working: true
          agent: "main"
          comment: "IMPLEMENTED: Updated addNewNode function to use viewport center with spiral positioning algorithm to find free space around user's current view center."

  - task: "Smooth app loading without node jumping"
    implemented: true
    working: true
    file: "App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        - working: true
          agent: "main"
          comment: "IMPROVED: Reduced initial layout delay from 1000ms to 100ms to minimize visible jumping when app loads."

  - task: "Enhanced realign nodes with category columns"
    implemented: true
    working: true
    file: "App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        - working: true
          agent: "main"
          comment: "IMPLEMENTED: Completely rewrote applyLayout function to arrange nodes in columns by category type (topics, literature, cases, tasks) in the center of current viewing area."

  - task: "Auto-save mind map data on changes"
    implemented: true
    working: true
    file: "App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: true
          agent: "testing"
          comment: "VERIFIED: Auto-save triggers on node drag, edit, create, and delete operations. Changes persist after refresh."
        - working: true
          agent: "main"
          comment: "ENHANCED: Added immediate save for connections to prevent timing issues with debounced auto-save."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Fix connection persistence during mode switches"
    - "Fix subpage loading issues"  
    - "Center new nodes in current view"
    - "Enhanced realign nodes with category columns"
    - "Verify existing mind map API endpoints work correctly"
  stuck_tasks:
    - "Fix connection persistence during mode switches"
    - "Fix subpage loading issues"
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Implemented comprehensive fixes for connection persistence issues and UX improvements. Key changes: 1) Added delay in mode switching to ensure auto-save completes 2) Added immediate localStorage save for connections 3) Updated addNewNode to center in viewport 4) Rewrote applyLayout for category-based columns 5) Reduced initial layout delays. All tasks need retesting to verify fixes work."
    - agent: "testing"
      message: "Completed comprehensive backend API testing. All backend endpoints are working correctly. CRUD operations for all entity types (topics, cases, tasks, literature) function as expected. Position fields are properly stored and retrieved. Connection persistence between entities is working correctly. The init-sample-data endpoint successfully initializes sample data. The backend is ready to support the frontend connection persistence and UX improvements."