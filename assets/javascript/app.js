var config = {
    apiKey: "AIzaSyD4NK7AJUjxIsRxZnLkLCMR9VkMKL6w-9w",
    authDomain: "gtcb-train-scheduler-90e35.firebaseapp.com",
    databaseURL: "https://gtcb-train-scheduler-90e35.firebaseio.com",
    projectId: "gtcb-train-scheduler-90e35",
    storageBucket: "gtcb-train-scheduler-90e35.appspot.com",
    messagingSenderId: "454263352210"
};
firebase.initializeApp(config);

var database = firebase.database();
var trainName, destinationName, trainTime, frequency;

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function calculateNextTime(frequency, enteredTime, currentTime) {
    while (moment(enteredTime, "HH:mm").isBefore(moment(currentTime, "HH:mm"))) {
        enteredTime = enteredTime.add(frequency, "minutes");
      }
    return enteredTime;
}

function calculateTimeDifference(nextArrivalTime, currentTime) {
    var then = moment(nextArrivalTime, "HH:mm");
    var now = moment(currentTime, "HH:mm");
    return parseInt(moment.duration(then.diff(now)).asMinutes());
}

function createTrainRow(childFields, nextArrivalTime, minutesToNextArrival) {
    var newRow = $('<tr>').append(
        $('<td>').text(childFields.trainName),
        $('<td>').text(childFields.destinationName),
        $('<td>').text(childFields.frequency),
        $('<td>').text(nextArrivalTime),
        $('<td>').text(minutesToNextArrival),
        $('<td id="'+ childFields.keyId +'" class="fa fa-trash fa-lg">')
    );

    $('tbody').append(newRow);
}

$('#add-train-btn').on("click", function(e) {
    e.preventDefault();

    trainName = $('#train-name-input').val().trim();
    destinationName = $('#destination-input').val().trim();
    trainTime = $('#time-input').val().trim();
    frequency = parseInt($('#frequency-input').val().trim());

    var reference = database.ref().push();
    var saveTrainObj = {
        trainName: toTitleCase(trainName),
        destinationName: toTitleCase(destinationName),
        trainTime: trainTime,
        frequency: frequency,
        keyId: reference.key
    }

    reference.set(saveTrainObj);

    $('#train-name-input').val("");
    $('#destination-input').val("");
    $('#time-input').val("");
    $('#frequency-input').val("");
});

database.ref().on("child_added", function(childSnapshot) {
    var childFields = childSnapshot.val();
    var enteredTime = moment(childSnapshot.val().trainTime, "HH:mm");
    var currentTime = moment();

    if (moment(enteredTime, "HH:mm").isBefore(moment(currentTime, "HH:mm"))) {
        var nextArrivalTime = calculateNextTime(childSnapshot.val().frequency, enteredTime, currentTime);
        var minutesToNextArrival = calculateTimeDifference(nextArrivalTime, currentTime);
        nextArrivalTime = nextArrivalTime.format("hh:mm a").toUpperCase();

        createTrainRow(childFields, nextArrivalTime, minutesToNextArrival);        
    } else {
        var nextArrivalTime = enteredTime.format("hh:mm a").toUpperCase();
        var minutesToNextArrival = calculateTimeDifference(enteredTime, currentTime);

        createTrainRow(childFields, nextArrivalTime, minutesToNextArrival);        
    }
});

$(document).on("click", '.fa-trash', function() {
    var keyId = $(this).attr('id');
    database.ref(keyId).remove().then(function() {
        location.reload();
    }).catch(function(error) {
      console.log("Remove failed: " + error.message)
    });
})