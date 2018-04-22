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
    let database = firebase.database();

    let form = $("#newTrainForm");
    form.on("submit", function (event) {
        //debugger
        event.preventDefault();
        if (form[0].checkValidity() === false) {
            event.stopPropagation();
            form[0].classList.add('was-validated');
        }
        else {
            // Code for handling the push
            database.ref('trains').push({
                trainName: $("#trainName").val().trim(),
                trainDestination: $("#destination").val().trim(),
                trainStartTime: $("#firstTrainTime").val().trim(),
                trainFrequency: $("#frequency").val().trim(),
                dateAdded: firebase.database.ServerValue.TIMESTAMP
            });

            $("#trainName").val("");
            $("#destination").val("");
            $("#firstTrainTime").val("");
            $("#frequency").val("");
        }
    });


    // Firebase watcher + initial loader + order/limit HINT: .on("child_added"
    //database.ref().orderByChild("dateAdded").limitToLast(1).on("child_added", function (snapshot) {
    database.ref("trains").on("child_added", function (snapshot) {
        let keyForSingleObject = snapshot.key;
        createTrainInfoRow(keyForSingleObject, snapshot.val());

        // Handle the errors
    }, function (errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

});


function createTrainInfoRow(key, sv) {
    // Console.loging the last user's data
    console.log(sv.trainName + " " + sv.trainDestination + " " + sv.trainStartTime + " " + sv.trainFrequency);

    let todaysStart = moment();
    $("currentTime").text(todaysStart.format("HH:mm"));
    // change the time to reflect the train's starting time
    todaysStart.hour(sv.trainStartTime.substring(0, 2));
    todaysStart.minute(sv.trainStartTime.substring(3, 5));

    // 
    let diffBetweenStartAndNow = moment.duration(moment().diff(todaysStart));

    let minsBetweenStartAndNow = Math.round(diffBetweenStartAndNow.asMinutes());

    console.log("minsBetweenStartAndNow: " + minsBetweenStartAndNow);

    let nextArrival = 0;
    let minutesAway = 0;

    if (minsBetweenStartAndNow == 0) {
        // the 1st train is coming now
        nextArrival = moment().format("HH:mm");
        minutesAway = 0;
    }
    else if (minsBetweenStartAndNow < 0) {
        // first traing hasn't come
        nextArrival = sv.trainStartTime;
        minutesAway = -minsBetweenStartAndNow;
    }
    else {
        // first train has gone by and we are waiting for a later one
        let tripsGoneBy =
            Math.ceil(minsBetweenStartAndNow / parseInt(sv.trainFrequency));
        console.log("tripsGoneBy: " + tripsGoneBy);
        nextArrival =
            todaysStart.add(tripsGoneBy * parseInt(sv.trainFrequency), 'm');
        minutesAway =
            moment.duration(nextArrival.diff(moment())).asMinutes();
        minutesAway = Math.round(minutesAway);
        nextArrival = nextArrival.format("HH:mm");

    }

    let e = `
        <tr>
            <td>${sv.trainName}</td>
            <td>${sv.trainDestination}</td>
            <td>${sv.trainFrequency}</td>
            <td>${nextArrival}</td>
            <td>${minutesAway}</td>
            <td class="hidden">${key}</td>
        </tr>`;
    $("#dynamicTrainContent").append(e);
}


// i need to pull the data from the server every minute for update
// in case i implement the updating of trains feature
setInterval(function () {
    firebase.database().ref("trains").once('value').then(function (snapshot) {
        $("#dynamicTrainContent").empty();
        let sv = snapshot.val();
        //console.log(sv);
        for (var key in sv) {
            //console.log(key + " -> " + sv[key]);
            createTrainInfoRow(key, sv[key]);
        }
    });
}, 60000);

