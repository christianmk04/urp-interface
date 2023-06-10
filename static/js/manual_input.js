var ul = document.querySelector('.tags-input ul');
var input = document.querySelector('.tags-input ul input');
var removeAll = document.querySelector('.removeAll button')

var tags = ['Automation', 'Version Control', 'Kanban'];

function showTags() {
    document.querySelectorAll('.tags-input ul li').forEach(li => li.remove());
    tags.forEach((value,key) => {
        let newLi = document.createElement('li');
        newLi.innerText = value;
        let newRemove = document.createElement('div');
        newRemove.classList.add('remove');
        newRemove.setAttribute('id', value);
        newRemove.setAttribute('onclick', `removeItem(this)`);
        newLi.appendChild(newRemove);
        ul.appendChild(newLi);
    });
}

showTags();

function removeItem(this_item) {

    for (let index = 0; index < tags.length; index++) {
        if (tags[index] === this_item.id) {
            tags.splice(index, 1);
        }
    }
    showTags();
}

removeAll.addEventListener('click', () => {
    tags = [];
    showTags();
});


input.addEventListener('keyup', (event) => {
    
    if (event.key === 'Enter') {
        if (!tags.includes(input.value)) {
            tags.push(input.value);
            showTags();
        }
        else {
            alert('This tag already exists!');
        }
        input.value = '';
    }
    
});