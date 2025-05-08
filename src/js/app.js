App = {
  webProvider: null,
  contracts: {},
  account: '0x0',

  initWeb: async function() {
    console.log('started');
    if (window.ethereum) {
      App.webProvider = window.ethereum;
      document.getElementById("reg-form").style.display = "block";
      // document.getElementById("report-form").style.display = "block";
      document.getElementById("search-form").style.display = "block";
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log(accounts);
        App.account = accounts[0];
        console.log("Connected account:", App.account);
      } catch (error){
        console.log(error);
      }
    } else {
      $("#loader-msg").html('No metamask ethereum provider found');
      App.webProvider = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    }
    return App.initContract();
  },


  initContract: function() {
    $.getJSON("MissingPersons.json", function( missingPersons) {
      App.contracts.MissingPersons = TruffleContract(missingPersons);
      App.contracts.MissingPersons.setProvider(App.webProvider);
      // App.listenForEvents();
      return App.render();
    });
  },

  registerUser: async function() {
    const name = document.getElementById("name").value;
    const role = document.getElementById("role").value;
    const addr = document.getElementById("addr").value;
    const contractInstance = await App.contracts.MissingPersons.deployed();

    try{
      await contractInstance.registerUser(App.account, name, role, addr, { from: App.account });
      alert("Success!");
      location.reload();
    } catch (error){
      console.log(error);
      alert("Failed");
    }

  },

  submitReport: async function() {
    const rname = document.getElementById("rname").value;
    const rage = document.getElementById("rage").value;
    const rloc = document.getElementById("rloc").value;
    const rheight = document.getElementById("rheight").value;
    const rdesc = document.getElementById("rdesc").value;
    const rcon = document.getElementById("rcon").value;
    const contractInstance = await App.contracts.MissingPersons.deployed();

    try{
      await contractInstance.addMissingPerson(App.account, rname, rage, rheight, rdesc, rloc, rcon, { from: App.account });
      alert("Success!");
    } catch(error){
      console.log(error);
      alert("Failed");
    }
  },


  searchMissingPersons: async function(check) {
    const divisionList = {
      0: "Dhaka",
      1: "Barishal",
      2: "Chittagong",
      3: "Khulna",
      4: "Rangpur",
      5: "Mymensingh",
      6: "Sylhet",
      7: "Rajshahi"
    }
    
    const contractInstance = await App.contracts.MissingPersons.deployed();
    const result = await contractInstance.sorting.call(check, { from: App.account });
    console.log(result);
    let divisions = result[0];
    const counts = result[1];

    const tbody = document.getElementById("resultsBody");

    tbody.innerHTML = "";
    console.log(divisions);
    for (let i=0; i<divisions.length; i++){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${divisionList[divisions[i]]}</td><td>${counts[i]}</td>`;
      tbody.appendChild(tr);
    }

    document.getElementById("resultsTable").style.display="table";
  },


  updateStatus: async function() {
    const caseId = parseInt(document.getElementById("caseId").value);
    const newStatus = parseInt(document.getElementById("newStatus").value);
    const contractInstance = await App.contracts.MissingPersons.deployed();
  
    try {
      await contractInstance.updateMissingStatus(App.account, caseId, newStatus, { from: App.account });
      alert("Success!");
    } catch (error) {
      console.error(error);
      alert("Failed!");
    }
  },


  assignInvestigator: async function () {
    const caseId = document.getElementById("assign-case-id").value;
    const investigatorAddr = document.getElementById("investigator-addr").value;
  
    const contractInstance = await App.contracts.MissingPersons.deployed();
  
    try {
      await contractInstance.assignInvestigator(App.account, caseId, investigatorAddr, {
        from: App.account
      });
      alert("Investigator Assigned Successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to assign investigator: " + error.message);
    }
  },
  

  bookInvestigationSlot: async function () {
    const caseId = document.getElementById("case-id").value;
    const investigator = document.getElementById("investigator-address").value;
    const slot = document.getElementById("slot").value;
    const adminAddr = document.getElementById("admin-address").value;
  
    const contractInstance = await App.contracts.MissingPersons.deployed();
  
    try {
      await contractInstance.bookSlot(caseId, slot, investigator, App.account, adminAddr,{
        from: App.account,
        value: 10000000000000000 
      });
  
      document.getElementById("booking-status").style.display = "block";
    } catch (error) {
      console.error(error);
      alert("Booking failed: " + error.message);
    }
  },
  

  reportFound: async function () {
    const caseId = document.getElementById("report-case-id").value;
    const contractInstance = await App.contracts.MissingPersons.deployed();

    try {
      await contractInstance.reportFoundByInvestigator(caseId, { from: App.account });
      alert("Report submitted successfully!");
    } catch (error) {
      console.error("Error reporting case as found:", error);
      alert("Failed to submit report--->", error);
    }
  },
  

  render: async function() {
    const urgency = ["High", "Medium", "Low"]
  
    const contractInstance = await App.contracts.MissingPersons.deployed();
    // This part won't work!

  
    // console.log("REndering started!");
    try {

      const userrole = await contractInstance.getUserRole(App.account);
      // console.log(`USER ROLE: ${userrole}`);
      if (userrole.toString() === "0") { // Admin
        document.getElementById("reg-form").style.display = "none";
        document.getElementById("assign-investigator-form").style.display = "block";
        document.getElementById("status-update-form").style.display = "block";
        document.getElementById("appointments-section").style.display = "block";
        document.getElementById("reported-cases-section").style.display = "block";
        await App.viewReportedCases();

        const caseIdsRaw = await contractInstance.getAllCaseIds();
        const caseIds = caseIdsRaw.map(id => id.toNumber());

        const caseIdDropdown = document.getElementById("caseId");
        caseIdDropdown.innerHTML = "";
        const assignCaseDrop = document.getElementById("assign-case-id");
        assignCaseDrop.innerHTML = "";

        caseIds.forEach(async (caseId) => {
          const option = document.createElement("option");
          option.value = caseId;
          const missingStatus = await contractInstance.getMissingStatusById(caseId);
          if (missingStatus == 0){
            const missingName = await contractInstance.getMissingNameById(caseId);
            const missingUrgency = await contractInstance.getMissingUrgencyById(caseId);
            const missingAddr = await contractInstance.getMissingDivisionById(caseId);
            option.textContent = `${caseId} - ${missingName} - ${urgency[missingUrgency]}  - ${missingAddr}`;
            // option.textContent = caseId;
            caseIdDropdown.appendChild(option);
            // assignCaseDrop.appendChild(option);
          }
          
        });

        caseIds.forEach(async (caseId) => {
          const option = document.createElement("option");
          option.value = caseId;
          const missingStatus = await contractInstance.getMissingStatusById(caseId);
          if (missingStatus == 0){
          const missingName = await contractInstance.getMissingNameById(caseId);
          const missingUrgency = await contractInstance.getMissingUrgencyById(caseId);
          const missingAddr = await contractInstance.getMissingDivisionById(caseId);
          option.textContent = `${caseId} - ${missingName} - ${urgency[missingUrgency]}  - ${missingAddr}`;
          assignCaseDrop.appendChild(option);
          }
        });

        const investigatorAddresses =  await contractInstance.getAllInvestigators();
        const investigatorDropdown = document.getElementById("investigator-addr");
        investigatorDropdown.innerHTML = "";
        investigatorAddresses.forEach(async (investigatorAddr) => {
          const investigatorName = await contractInstance.getUserName(investigatorAddr);
          const investigatorAddrs = await contractInstance.getUserAddress(investigatorAddr);
          const option = document.createElement("option");
          option.value = investigatorAddr;
          option.textContent = `${investigatorName} - ${investigatorAddrs}`;
          investigatorDropdown.appendChild(option);
        });

      }
      if (userrole.toString() === "1") { // Reporter
        document.getElementById("reg-form").style.display = "none";
        document.getElementById("report-form").style.display = "block";
        document.getElementById("slot-booking").style.display = "block";
        document.getElementById("appointments-section").style.display = "block";


        const contractInstance = await App.contracts.MissingPersons.deployed();
        const adminDropdown = document.getElementById("admin-address");
        adminDropdown.innerHTML = "";

        const adminAddresses = await contractInstance.getAllAdmins();

        adminAddresses.forEach((adminAddr) => {
          const option = document.createElement("option");
          option.value = adminAddr;
          option.textContent = adminAddr;
          adminDropdown.appendChild(option);
        });

        const investigatorDropdown = document.getElementById("investigator-address");
        investigatorDropdown.innerHTML = "";
        const investigators = await contractInstance.getAllInvestigators();
        investigators.forEach((investigator) => {
          const option = document.createElement("option");
          option.value = investigator;
          option.textContent = investigator;
          investigatorDropdown.appendChild(option);
        });
        const investigator = document.getElementById("investigator-address").value;
        const availableSlots = await contractInstance.getAvailableSlots(investigator);

        const slotDropdown = document.getElementById("slot");
        slotDropdown.innerHTML = "";

        availableSlots.forEach((isAvailable, index) => {
          if (isAvailable) {
            const option = document.createElement("option");
            const startTime = new Date(2025, 4, 3, 16, index * 10); // Example: 4:00 PM + index * 10 minutes
            const endTime = new Date(startTime.getTime() + 10 * 60000); // Add 10 minutes
            option.value = index;
            option.textContent = `${startTime.getHours()}:${startTime.getMinutes()} - ${endTime.getHours()}:${endTime.getMinutes()}`;
            slotDropdown.appendChild(option);
          }
        });

        const caseIdsRaw = await contractInstance.getAllCaseIds();
        const caseIds = caseIdsRaw.map(id => id.toNumber());

        const caseIdDropdown = document.getElementById("case-id");
        caseIdDropdown.innerHTML = "";
        caseIds.forEach(async (caseId) => {
          const option = document.createElement("option");
          option.value = caseId;
          const missingStatus = await contractInstance.getMissingStatusById(caseId);
          if (missingStatus == 0){
            const missingName = await contractInstance.getMissingNameById(caseId);
            const missingAddr = await contractInstance.getMissingDivisionById(caseId);
            option.textContent = `${caseId} - ${missingName} - ${missingAddr}`;
            // option.textContent = caseId;
            caseIdDropdown.appendChild(option);
            // assignCaseDrop.appendChild(option);
          }
          
        });

      } 
      if (userrole.toString() === "2") { // Investigator
        document.getElementById("reg-form").style.display = "none";
        document.getElementById("appointments-section").style.display = "block";
        document.getElementById("report-found-section").style.display = "block";

        const caseIdsRaw = await contractInstance.getAllCaseIds();
        const caseIds = caseIdsRaw.map(id => id.toNumber());

        const caseIdDropdown = document.getElementById("report-case-id");
        caseIdDropdown.innerHTML = "";
        caseIds.forEach(async (caseId) => {
          const option = document.createElement("option");
          option.value = caseId;
          const missingStatus = await contractInstance.getMissingStatusById(caseId);
          if (missingStatus == 0){
            const missingName = await contractInstance.getMissingNameById(caseId);
            const missingAddr = await contractInstance.getMissingDivisionById(caseId);
            option.textContent = `${caseId} - ${missingName} - ${missingAddr}`;
            // option.textContent = caseId;
            caseIdDropdown.appendChild(option);
            // assignCaseDrop.appendChild(option);
          }
          
        });

      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }

    try {
      await App.viewAppointments();
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
    
    // loader.hide();
    // content.show();
  },

  viewAppointments: async function () {
    const contractInstance = await App.contracts.MissingPersons.deployed();

    try {
      const [investigatorAddresses, caseIds, reporterAddresses, slots] = await contractInstance.viewAppointment();
      const tbody = document.getElementById("appointmentsBody");
      tbody.innerHTML = "";

      const investigatorNids = investigatorAddresses;
      const reporterNids = reporterAddresses;

      for (let i = 0; i < investigatorNids.length; i++) {
        const investigatorName = await contractInstance.getUserName(investigatorNids[i]);
        const reporterName = await contractInstance.getUserName(reporterNids[i]);
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${investigatorName}</td><td>${caseIds[i]}</td><td>${reporterName}</td><td>${slots[i]}</td>`;
        tbody.appendChild(tr);
      }

      document.getElementById("appointmentsTable").style.display = "table";
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  },

  viewReportedCases: async function () {
    const contractInstance = await App.contracts.MissingPersons.deployed();

    try {
        const caseIdsRaw = await contractInstance.getAllCaseIds();
        const caseIds = caseIdsRaw.map(id => id.toNumber());
        const tbody = document.getElementById("reportedCasesBody");
        tbody.innerHTML = "";

        for (const caseId of caseIds) {
            const isReported = await contractInstance.isReportedFound(caseId);
            const status = await contractInstance.getMissingStatusById(caseId);

            // Check if the case was reported by investigator AND status is Found (1)
            if (isReported) {
                const [
                    id,
                    name,
                    ,
                    ,
                    ,
                    ,
                    division,
                    contactNumber
                ] = await contractInstance.getCaseById(caseId);

                const investigatorAddress = await contractInstance.getInvestigatorByCaseId(caseId);
                const investigatorName = await contractInstance.getUserName(investigatorAddress);

                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${id}</td><td>${name}</td><td>${division}</td><td>${contactNumber}</td><td>${investigatorName}</td>`;
                tbody.appendChild(tr);
            }
        }

        document.getElementById("reportedCasesTable").style.display = "table";
    } catch (error) {
        console.error("Error fetching reported cases:", error);
    }
  }

};

$(function() {
  $(window).load(function() {
    App.initWeb();
  });
});
