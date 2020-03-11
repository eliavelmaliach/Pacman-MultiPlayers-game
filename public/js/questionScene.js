import Phaser from 'phaser';
import $ from 'jquery';

export class QuestionScene extends Phaser.Scene {
    constructor() {
        super({ key: "Question_scene_key" });
    }

    //=====================================================================================================
    init(obj) {
        this.question = obj.question;
        this.answers = obj.answers;
        this.correct_answer = obj.correct_answer;
    }

    //=====================================================================================================
    preload() {
        this.load.html("HTML_questions", '/assets/dom/html/questions/questions.html');
    }

    //=====================================================================================================
    create() {
        const { centerX, centerY } = this.cameras.main;
        this.add.dom(centerX, centerY).createFromCache('HTML_questions');
        this.update_display();
    }

    //=====================================================================================================
    update_display() {
        $('#question_display').html("<br/>" + this.question)
        let q_index;
        for (let i = 0; i < 4; i++) {
            q_index = i + 1;
            $('#q' + q_index).html("<br/>" + this.answers[i])
        }
    }
}

