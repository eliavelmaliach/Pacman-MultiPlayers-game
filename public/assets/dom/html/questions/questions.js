
var questions_container = new Array(4);

function get_all_questions() {
    for(let i=0;i<questions_container.length;i++){
        get_next_question(i);
    }
    console.log(questions_container);
}

function get_next_question(i) {
    $.ajax({
        type: 'GET',
        url: "https://opentdb.com/api.php?amount=1&type=multiple",
        data: { get_param: 'value' },
        dataType: 'json',
        success: function (data) {
            // $('#question_display').html(data.results[0].question)
            // let rand_num = Math.floor((Math.random() * 3));
            // let answers = data.results[0].incorrect_answers;
            // let correct_answer_ghost = 0;
            // answers.push(data.results[0].correct_answer)
            // answers.sort(() => Math.random() - 0.5);
            // for (let i = 0; i < 4; i++) {
            //     q_index = i + 1;
            //     $('#q' + q_index).html("<br />" + answers[i])
            //     if (answers[i] === data.results[0].correct_answer) {
            //         correct_answer_ghost = 'q' + q_index;
            //     }
            // }
            if(data.results[0].incorrect_answers != 3){
                get_next_question(i);
            }
            questions_container[i] = data.results;
        }
    });
}