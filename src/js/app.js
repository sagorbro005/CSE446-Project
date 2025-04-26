App = {
  // the vaiable below will store references of wallet, smart contract and your accounts
  webProvider: null,
  contracts: {},
  account: '0x0',
 
 
  initWeb:function() {
      // if an ethereum provider instance is already provided by metamask
      const provider = window.ethereum
      if( provider ){
        App.webProvider = provider;
      }
      else{
        $("#loader-msg").html('No metamask ethereum provider found')
  
        // specify default instance if no web3 instance provided
        App.webProvider = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
      }
   
      return App.initContract();
  },
 
 
  initContract: function() {
      $.getJSON("Election.json", function( election ){
        // instantiate a new truffle contract from the artifict
        App.contracts.Election = TruffleContract( election );
   
        // connect provider to interact with contract
        App.contracts.Election.setProvider( App.webProvider );
  
        // TODO_JS-5:YOU WILL ADD listenForEvents() FUNCTION CALL DURING LAB SESSION BELOW"
        App.listenForEvents();
        return App.render();
      })
  },
 
 // NOTE: render function starts below  
  render: async function(){
      // reference of html loading text
      const loader = $("#loader");
      // reference of all the html contents
      const content = $("#content");
   
      loader.show();
      content.hide();
     
      // open wallet and load account data
      if (window.ethereum) {
        try {
          // recommended approach to requesting user to connect mmetamask instead of directly getting the list of connected account
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          App.account = accounts;
          $("#accountAddress").html(`You have ${ App.account.length } account connected from metamask: ${ App.account } <br/> Current account in use: ${App.account[0]}`);
        } catch (error) {
          if (error.code === 4001) {
            // User rejected request
            console.warn('user rejected')
          }
          $("#accountAddress").html("Your Account: Not Connected");
          console.error(error);
        }
      }
 
      //load contract instance
      const contractInstance = await App.contracts.Election.deployed()
      // retrieving count of currentlt available candidate  
      const candidatesCount = await contractInstance.candidatesCount();

      
      const candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      const candidatesSelect = $("#candidatesSelect");
      candidatesSelect.empty();
 
 
      for (let i = 1; i <= candidatesCount; i++) {
          // calling the public mapping data object "candidates" from smart contract to retrieve voting candidates info
          const candidate = await contractInstance.candidates( i )
          const id = candidate[0];
          const name = candidate[1];
          const voteCount = candidate[2];
    
          // creating html template which will be added to frontend dynamically
          const candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
    
          // now adding the candidateTemplate html template dynamically into frontend
          candidatesResults.append( candidateTemplate );
    
          // TODO_JS-1: STUDENTS WILL ADD VOTING CANDIDATE SELECT OPTION DURING LAB SESSION BELOW
          //creating html template for voter candidate option which will be added to frontend dynamically
          const candidateOption = "<option value=" + id +  ">" + name + "</option>"

          // now the html candidateOption template is being dynamically added into the frontend dynamically
          candidatesSelect.append( candidateOption )
      }
    
      // TODO_JS-2: STUDENTS WILL ADD WHEATHER THE CURRENT METAMASK ACCOUNT WAS USED TO CAST VOTE BEFORE 
      // checking if the currently metamask wallet account already voted | if already casted vote the account address will be returned 
      const hasVoted = await contractInstance.voters(  App.account[0] )

      // if already voted, voting form gets hidden
      if(hasVoted){
        $( "form" ).hide()
      }
      loader.hide();
      content.show();
  },
  // NOTE: render FUNCTION ENDS ABOVE
  // TODO_JS-3: castVote WILL BE ADDED BELOW
    // Once the vote button from frontend is clicked, the function below will be called and update the smart contract 
    castVote: async function(){
      const contractInstance = await App.contracts.Election.deployed()
      
      // fetch the currently selected candidate value(This is the candidate id)
      const candidateId = $("#candidatesSelect").val();
      const result = await contractInstance.vote( candidateId, { from: App.account[0] } )
  
      alert("You have voted successfully")
    },
  //TODO_JS-4: listenForEvents FUNCTION SOULD BE ADDED BELOW
  // voted event
  listenForEvents: async function(){
    const contractInstance = await App.contracts.Election.deployed()

    contractInstance.votedEvent({}, {
      fromBlock: 0,
      toBlock: "latests"
    })
    .watch( function( err, event ){
      console.log("Triggered", event);

      // reload page
      App.render()
    })
  }


 };
 
 
 $(function() {
  $(window).load(function() {
    App.initWeb();
  });
 });
 
