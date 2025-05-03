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
        App.account = accounts[0]; // Get first connected MetaMask account
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
      await contractInstance.bookslot(caseId, slot, investigator, App.account, {
        from: App.account,
        value: web3.toWei(0.01, "ether") // 0.01 ETH
      });
  
      document.getElementById("booking-status").style.display = "block";
    } catch (error) {
      console.error(error);
      alert("Booking failed: " + error.message);
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
        investigatorAddresses.forEach((investigatorAddr) => {
          const option = document.createElement("option");
          option.value = investigatorAddr;
          option.textContent = investigatorAddr;
          investigatorDropdown.appendChild(option);
        });

      }
      if (userrole.toString() === "1") { // Reporter
        document.getElementById("reg-form").style.display = "none";
        document.getElementById("report-form").style.display = "block";
        document.getElementById("slot-booking").style.display = "block";


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

      } 
      if (userrole.toString() === "2") { // Investigator
        document.getElementById("reg-form").style.display = "none";
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
    
    // loader.hide();
    // content.show();
  }
  


};

$(function() {
  $(window).load(function() {
    App.initWeb();
  });
});
