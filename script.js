var aulas;
var index = 0;
var hoje;
var isMobile;
var title;
var notificacao;
var notificacaoDisponivel;

var dias = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira', 'Sábado'];

function compilarAula(linha, index, array){
  linha = linha.trim();
  if(linha !== '' && !linha.startsWith('\\')){
    infos = linha.split(';');
    aulas.push(new Aula(infos[0], infos[1], infos[2], infos[3], infos[4], infos[5]))
  }
}

function lerArquivo(e){
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    lines = e.target.result.split('\n');
    aulas = new Array();
    lines.forEach(compilarAula);
    setCookie('aulas', JSON.stringify(aulas), 365);
    hoje = new Date();
    index = procurarAula(0);
    refresh();
    document.getElementById('novoHorario').innerHTML = 'carregar novo horario: ';
    document.getElementById('file').value = '';
    gerarTabela();
  };
  reader.readAsText(file);
}

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function esconderElemento(id){
  document.getElementById(id).style.display = 'none';
}

function procurarAula(inicio){
  if(!aulas)
    return;
  
  atual = inicio;

  let status;

  while(atual < aulas.length) {
    if(aulas[atual].dia.trim() === dias[hoje.getDay()].trim()){

      status = getStatusAula(atual);


      if(status > -1){
        return atual;
      }
    }

    atual++;
  }

  return -1;
}

function compararHoras(hAgora, mAgora, sAgora, h, m, s){

  if(s == undefined){
      s = 0;
  }
  var agora = horaToTime(hAgora, mAgora, sAgora);
  var alvo = horaToTime(h, m, s);

  return alvo - agora;

}

function getStatusAula(indexAula){

  let aula = aulas[indexAula];

  let infos = aula.inicio.split(':');
  let dif = compararHoras(hoje.getHours(), hoje.getMinutes(), hoje.getSeconds(), infos[0], infos[1]);

  if(dif > 0){
    return dif;
  }

  infos = aula.fim.split(':');
  dif = compararHoras(hoje.getHours(), hoje.getMinutes(), hoje.getSeconds(), infos[0], infos[1]);

  if(dif > 0){
    return 0;
  } else {
    return -1;
  }

}

function timeTohora(t){
    h = Math.floor(t / 3600);
    m = Math.floor((t / 60) % 60);
    s = t % 60;

    return [h, m, s];
}

function horaToTime(h, m, s){
    return Number(h * 60 * 60 + m * 60 + s);
}

var refresh = function(){

  hoje = new Date();
  let tituloAtual = title;

  if(aulas && aulas.length > 0){

    let msg;

    if(index === -1){
      msg = 'SEM AULA HOJE';
      notificacao = null;
    } else {
      let status = getStatusAula(index);

      if(status === -1){
        index = procurarAula(index+1)
      } else {
        tituloAtual = 'HF - (' + getSalaSimples(aulas[index]) + ') ';
        
        msg = '<hr>';
        msg += 'SALA ' + aulas[index].sala + '<br>';
        msg += 'AULA DE ' + aulas[index].nome + '<br>';
        if(status === 0){
          msg += 'AULA EM ANDAMENTO<br>';
          msg += '<input type="button" onClick="proxAula()" value="Pular está aula">';
          tituloAtual += 'EM ANDAMENTO'
          notificacao = null;
        } else {
          var restante = timeTohora(status);
          let hSimples = getHoursSimples(restante[0], restante[1], restante[2]);
          msg += 'AULA INICIA EM ' + hSimples;
          tituloAtual += ': ' + hSimples;
            
            if(status <= horaToTime(0, 5, 0)){
                notificar("PROXIMA AULA EM " + hSimples, 
                          "MATERIA: " + aulas[index].nome + "\n"
                        + "SALA: " + aulas[index].sala);
            }
          
        }
      }
    }

    document.getElementById('infoAtual').innerHTML = msg;
    document.getElementById('titulo').innerHTML = tituloAtual;
  }

}

function proxAula(){
  if(confirm('Realmente deseja pular está aula? está ação não poderá ser desfeita')){
    index = procurarAula(index+1);
    refresh();
  }
}

window.onload  = function(){

    isMobile = navigator.userAgent.indexOf('Mobi') > -1;

    title = document.getElementById('titulo').innerHTML;

    document.getElementById('file').value = "";
    document.getElementById('file').addEventListener('change', lerArquivo, false);
    var cookie = document.cookie;
    if(cookie !== '' && cookie.split('=')[1].trim() !== ''){
      aulas = JSON.parse(cookie.split('=')[1]);
      document.getElementById('novoHorario').innerHTML = 'carregar novo horario: ';
      gerarTabela();
    }
    hoje = new Date();
    index = procurarAula(0);
    refresh();
    window.setInterval(refresh, 1000);
    
    if(Notification){
       notificacaoDisponivel = true;
        
        if(Notification.permission !== "granted")
            Notification.requestPermission();
    } else {
        notificacaoDisponivel = false;
    }

}

function notificar(titulo, corpo){
    if(notificacaoDisponivel && !notificacao){
        notificacao = new Notification(titulo, {
            body : corpo,
        });
        
        let alarm = new Audio("alarm.mp3");
        alarm.play();
        
        notificacao.onclose = function(){
            alarm.pause();
            alarm.currentTime = 0;
        }
        
        
    }
}

function getHoursSimples(h, m, s){

  if((h > 0) || (m > 0)){
      m = ((m < 10)? '0' + m : m) + ':';
  } else {
      m = ''
  }

  if(h > 0){
    h = ((h < 10)? '0' + h : h) + ':';
  } else {
      h = '';
  }

  s = (s < 10)? '0' + s : s;


  return h + m + s;

}

function gerarTabela(){
  
    if(aulas.length == 0)
      return;
    var tabela = '<table>';

    tabela += '<tr>';
    tabela += '<th>Materia</th>';
    tabela += '<th>Sala</th>';
    tabela += '<th>Periodo</th>';
    tabela += '<th>Professor(a)</th>';
    tabela += '<th>Dia da Semana</th>';
    tabela += '</tr>';

    for(var i = 0; i < aulas.length; i++){
        tabela += '<tr>';
        tabela += '<td>' + aulas[i].nome + '</td>';
        tabela += '<td class="centralizado">' + getSala(aulas[i]) + '</td>';
        tabela += '<td class="centralizado">' + getInicioFim(aulas[i]) + '</td>';
        tabela += '<td>' + getProfessor(aulas[i]) + '</td>';
        tabela += '<td>' + getDia(aulas[i]).toUpperCase() + '</td>';
        tabela += '</tr>';
    }

    tabela += '</table>';

    document.getElementById('horarios').innerHTML = tabela;

}

function Aula(nome, sala, inicio, fim, professor, dia) {
  this.nome = nome;
  this.sala = sala;
  this.inicio = inicio;
  this.fim = fim;
  this.professor = professor;
  this.dia = dia;

}

function getDia(aula){
  if(isMobile){
    return aula.dia.split('-')[0];
  } else {
    return aula.dia;
  }
}

function getSalaSimples(aula){
    switch (aula.sala) {
      case 'INFORMÁTICA':
        return 'NAT';
        break;
      default:
        fim = aula.sala.indexOf('(');
        return (fim > 0)? aula.sala.substring(0, fim) : aula.sala;
    }
}

function getSala(aula){
  if(isMobile){
    return getSalaSimples(aula);
  } else {
    return aula.sala;
  }
}

function getProfessor(aula){
    if(isMobile){
        let infos = aula.professor.split(' ');

        if(infos.length > 2){            
            let i = 1;
            while(i < infos.length && infos[i].length <= 3){
                i++;
            }
            
            return infos[0] + ' ' + infos[i];
        } else {
            return aula.professor;
        }
    } else {
        return aula.professor;
    }
}

function getInicioFim(aula){
  if(isMobile){
    return aula.inicio + '<br>' + aula.fim;
  } else {
    return aula.inicio + ' ~ ' + aula.fim;
  }
}
