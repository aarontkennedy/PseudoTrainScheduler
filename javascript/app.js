$(document).ready(function () {
    // Initialize Firebase
    let config = {
        apiKey: "AIzaSyBhlawP2CJCdBGTT9v3AFJXSd1WuDRuFkE",
        authDomain: "mysandbox-d3105.firebaseapp.com",
        databaseURL: "https://mysandbox-d3105.firebaseio.com",
        projectId: "mysandbox-d3105",
        storageBucket: "mysandbox-d3105.appspot.com",
        messagingSenderId: "701778948919"
    };
    firebase.initializeApp(config);

    // Create a variable to reference the database.
    let database = firebase.database().ref("trains");


    // create an even handler that listens for form submittal
    // and validates the input from the user
    let form = $("#newTrainForm");
    form.on("submit", function (event) {
        //debugger
        event.preventDefault();
        if (form[0].checkValidity() === false) {
            event.stopPropagation();
            form[0].classList.add('was-validated');
        }
        else {
            // Code for handling the push to firebase
            database.push({
                trainName: $("#trainName").val().trim(),
                trainDestination: $("#destination").val().trim(),
                trainStartTime: $("#firstTrainTime").val().trim(),
                trainFrequency: $("#frequency").val().trim(),
                dateAdded: firebase.database.ServerValue.TIMESTAMP
            });

            // clear the inputs
            setFormValues(null, null, null, null, null);
        }
    });


    // Firebase watcher + initial loader + order/limit HINT: .on("child_added"
    //database.ref().orderByChild("dateAdded").limitToLast(1).on("child_added", function (snapshot) {
    database.on("child_added", function (snapshot) {
        let keyForSingleObject = snapshot.key;
        createTrainInfoRow(keyForSingleObject, snapshot.val());

        // Handle the errors
    }, function (errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });


    // dump the train info to the table
    function createTrainInfoRow(key, sv) {
        // Console.loging the last user's data
        console.log(sv.trainName + " " + sv.trainDestination + " " + sv.trainStartTime + " " + sv.trainFrequency);

        let now = moment();
        $("#currentTime").text(now.format("HH:mm"));
        let todaysStart = moment();
        // change the time to reflect the train's starting time
        todaysStart.hour(sv.trainStartTime.substring(0, 2));
        todaysStart.minute(sv.trainStartTime.substring(3, 5));

        // calculate the time between the train start and now
        let diffBetweenStartAndNow = moment.duration(now.diff(todaysStart));
        // change the duration to minutes
        let minsBetweenStartAndNow = Math.round(diffBetweenStartAndNow.asMinutes());

        console.log("minsBetweenStartAndNow: " + minsBetweenStartAndNow);

        let nextArrival = 0;
        let minutesAway = 0;

        if (minsBetweenStartAndNow == 0) {
            // the 1st train is coming now
            nextArrival = now.format("HH:mm");
            minutesAway = 0;
        }
        else if (minsBetweenStartAndNow < 0) {
            // first traing hasn't come
            nextArrival = sv.trainStartTime;
            minutesAway = -minsBetweenStartAndNow;
        }
        else {
            // first train has gone by and we are waiting for a later one
            // number of trips gone by, round up to get the next multiple
            let trainFreqInt = parseInt(sv.trainFrequency);
            let tripsGoneBy =
                Math.ceil(minsBetweenStartAndNow / trainFreqInt);
            console.log("tripsGoneBy: " + tripsGoneBy);
            let nextArrivalDateObject =
                todaysStart.add(tripsGoneBy * trainFreqInt, 'm');

            // need to handle the case that the next train is tomorrow?
            if (nextArrivalDateObject.isAfter(now, 'day')) {
                minutesAway = "NA";
                nextArrival = "Tomorrow";
            }
            else {
                minutesAway = Math.round(
                    moment.duration(
                        nextArrivalDateObject.diff(moment())).asMinutes());
                nextArrival = nextArrivalDateObject.format("HH:mm");
            }
        }

        let e = `
        <tr>
            <td>${sv.trainName}</td>
            <td>${sv.trainDestination}</td>
            <td>${sv.trainFrequency}</td>
            <td>${nextArrival}</td>
            <td>${minutesAway}</td>
            <td class="hidden">${key}</td>
            <td class="hidden">${sv.trainStartTime}</td>
        </tr>`;
        $("#dynamicTrainContent").append(e);
    }


    // i need to pull the data from the server every minute for update
    // in case i implement the updating of trains feature
    setInterval(function () {
        database().once('value').then(function (snapshot) {
            $("#dynamicTrainContent").empty();
            let sv = snapshot.val();
            //console.log(sv);
            for (var key in sv) {
                //console.log(key + " -> " + sv[key]);
                createTrainInfoRow(key, sv[key]);
            }
        });
    }, 60000);


    // listen for trains being clicked so they can be edited
    // entering update mode!
    $("tbody").on("click", "tr", function () {

        $("#formMode").text("Update");
        $("#deleteButton").show();

        console.log($(this).text());
        setFormValues($(this).children("td").eq(5).text(),
            $(this).children("td").eq(0).text(),
            $(this).children("td").eq(1).text(),
            $(this).children("td").eq(2).text(),
            $(this).children("td").eq(6).text());
    });


    // clear inputs and go back to add mode
    $("#cancelButton").on("click", function () {
        event.preventDefault();
        event.stopPropagation();
        // clear the inputs
        setFormValues(null, null, null, null, null);

        $("#formMode").text("Add");
        $("#deleteButton").hide();
    });
    $("#deleteButton").hide();


    // delete the record, remove from table and
    // clear inputs and go back to add mode
    $("#deleteButton").on("click", function () {
        event.preventDefault();
        event.stopPropagation();
        database.child(firebaseIDInput.val()).remove();

        let rows = $("tbody tr");
        for (let i = 0; i < rows.length; i++) {
            let row = $(rows[i]);
            alert(row.children().eq(5).text());
            if (row.children().eq(5).text() == firebaseIDInput.val()) {
                row.remove();
                break;
            }
        }
        
        // clear the inputs
        setFormValues(null, null, null, null, null);

        $("#formMode").text("Add");
        $("#deleteButton").hide();
    });


    const firebaseIDInput = $("#firebaseID");
    const trainNameInput = $("#trainName");
    const trainDestInput = $("#destination");
    const trainStartTimeInput = $("#firstTrainTime");
    const trainFrequencyInput = $("#frequency");

    function setFormValues(id, name, destination, startTime, frequency) {
        firebaseIDInput.val(id);
        trainNameInput.val(name);
        trainDestInput.val(destination);
        trainStartTimeInput.val(startTime);
        trainFrequencyInput.val(frequency);
    }

});
