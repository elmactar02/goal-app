pipeline {
  agent any

  stages {
    
    stage('Checkout') {
      steps {
        script {
          changedFiles = bat(script: "git diff --name-only HEAD~1", returnStdout: true).trim().split("\n")
        }
      }
    }

    stage('Build & Deploy Frontend') {
      when {
        expression { changedFiles.any { it.startsWith("frontend/") } }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: '4415de94-57cd-46fc-b59f-1430a7e813cb', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
         bat '''
          echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
          docker build -t mactargueye2003/front_first -f frontend/Dockerfile.prod frontend/
          docker push mactargueye2003/front_first
          set KUBECONFIG=C:\\Users\\macta\\.kube\\config
          kubectl apply -f kubernetes/frontend.yaml
        ''' 
      }
      }
    }

    stage('Build & Deploy Backend') {
      when {
        expression { changedFiles.any { it.startsWith("backend/") } }
      }
      steps {
        bat '''
        docker build -t mactargueye2003/back_first backend/
        docker push mactargueye2003/back_first
        kubectl apply -f kubernetes/backend.yaml
        '''
      }
    }

    stage('Build & Deploy Proxy') {
      when {
        expression { changedFiles.any { it.startsWith("proxy/") } }
      }
      steps {
        bat '''
        docker build -t mactargueye2003/proxy proxy/
        docker push mactargueye2003/proxy
        kubectl apply -f kubernetes/proxy.yaml
        '''
      }
    }

    stage('Deploy Only Changed YAMLs') {
  when {
    expression {
      changedFiles.any { it.endsWith(".yaml") || it.endsWith(".yml") }
    }
  }
  steps {
    script {
      def yamlFiles = changedFiles.findAll { it.endsWith(".yaml") || it.endsWith(".yml") }
      yamlFiles.each { file ->
        bat "kubectl apply -f ${file}"
      }
    }
  }
}

  }
}