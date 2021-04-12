
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js">
</script>

function handleButton(req, res) {
    $('#toRenderQuestions').on('click', function (event) {
        $("#userQuestions").css('display', 'block');
    });
}
handleButton();

