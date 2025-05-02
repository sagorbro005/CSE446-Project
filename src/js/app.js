App = {
  webProvider: null,
  contracts: {},
  account: '0x0',

  initWeb: async function() {
    console.log('started');
    if (window.ethereum) {
      App.webProvider = window.ethereum;
      document.getElementById("reg-form").style.display = "block";
      document.getElementById("report-form").style.display = "block";
      document.getElementById("search-form").style.display = "block";
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
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
      App.listenForEvents();
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
    let divisions = result[0];   //need fix, getting empty strings
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
  }
  // render: async function() {
  //   const loader = $("#loader");
  //   const content = $("#content");

  //   loader.show();
  //   content.hide();

  //   if (window.ethereum) {
  //     try {
  //       const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  //       App.account = accounts;
  //       $("#accountAddress").html(`You have ${ App.account.length } account connected from metamask: ${ App.account } <br/> Current account in use: ${App.account[0]}`);
  //     } catch (error) {
  //       if (error.code === 4001) {
  //         console.warn('user rejected')
  //       }
  //       $("#accountAddress").html("Your Account: Not Connected");
  //       console.error(error);
  //     }
  //   }

  //   const contractInstance = await App.contracts.MissingPersons.deployed();

  //   const caseCount = await contractInstance.currCaseId;

  //   const caseResults = await $("#caseResults");
  //   caseResults.empty()

  //   const personResults = await $("#personsResults");
  //   personsResults.empty();

  // }


};

$(function() {
  $(window).load(function() {
    App.initWeb();
  });
});
